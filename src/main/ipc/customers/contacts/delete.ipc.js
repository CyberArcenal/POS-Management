// customers/contacts/delete.ipc.js
//@ts-check
const CustomerContact = require("../../../../entities/CustomerContact");
// @ts-ignore
const Customer = require("../../../../entities/Customer");
const { log_audit } = require("../../../../utils/auditLogger");

/**
 * @param {Object} params
 * @param {{ manager: { getRepository: (arg0: any) => any; }; }} queryRunner
 */
async function deleteContact(params, queryRunner) {
  const { 
    // @ts-ignore
    contact_id,
    // @ts-ignore
    _userId 
  } = params;
  
  try {
    const contactRepo = queryRunner.manager.getRepository(CustomerContact);

    // Find contact
    const contact = await contactRepo.findOne({
      where: { id: contact_id },
      relations: ["customer"]
    });

    if (!contact) {
      return {
        status: false,
        message: "Contact not found",
        data: null,
      };
    }

    // Check if this is the default contact
    const isDefault = contact.is_default_contact;
    const customerId = contact.customer_id;

    // Delete contact
    await contactRepo.remove(contact);

    // If this was the default contact, set another one as default
    if (isDefault) {
      const otherContacts = await contactRepo.find({
        where: { customer_id: customerId },
        order: { created_at: "ASC" },
        take: 1
      });

      if (otherContacts.length > 0) {
        await contactRepo.update(otherContacts[0].id, { is_default_contact: true });
      }
    }

    // Log activity
    await log_audit("delete_contact", "Customer", customerId, _userId, {
      customer_code: contact.customer.customer_code,
      contact_id: contact.id,
      contact_name: `${contact.first_name} ${contact.last_name}`,
      was_default: isDefault,
    });

    return {
      status: true,
      message: "Contact deleted successfully",
      data: {
        contact_id,
        customer_id: customerId,
        was_default: isDefault,
        deleted_at: new Date(),
      },
    };
  } catch (error) {
    console.error("deleteContact error:", error);
    
    await log_audit("error", "CustomerContact", 0, _userId, {
      // @ts-ignore
      error: error.message,
      contact_id,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to delete contact: ${error.message}`,
      data: null,
    };
  }
}

module.exports = deleteContact;