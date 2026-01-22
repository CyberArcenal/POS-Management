// customers/contacts/update.ipc.js
//@ts-check
const CustomerContact = require("../../../../entities/CustomerContact");
const Customer = require("../../../../entities/Customer");
const { log_audit } = require("../../../../utils/auditLogger");

/**
 * @param {Object} params
 * @param {{ manager: { getRepository: (arg0: any) => any; }; }} queryRunner
 */
async function updateContact(params, queryRunner) {
  const { 
    // @ts-ignore
    contact_id,
    // @ts-ignore
    contact_data,
    // @ts-ignore
    _userId 
  } = params;
  
  try {
    const contactRepo = queryRunner.manager.getRepository(CustomerContact);
    // @ts-ignore
    const customerRepo = queryRunner.manager.getRepository(Customer);

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

    // Keep track of changes
    const changes = [];
    for (const key in contact_data) {
      if (contact[key] !== contact_data[key]) {
        changes.push({
          field: key,
          old_value: contact[key],
          new_value: contact_data[key]
        });
      }
    }

    // If setting as default, unset existing default
    if (contact_data.is_default_contact === true && !contact.is_default_contact) {
      await contactRepo.update(
        { customer_id: contact.customer_id, is_default_contact: true },
        { is_default_contact: false }
      );
    }

    // Update contact
    Object.assign(contact, contact_data);
    await contactRepo.save(contact);

    // Log activity
    await log_audit("update_contact", "Customer", contact.customer_id, _userId, {
      customer_code: contact.customer.customer_code,
      contact_id: contact.id,
      contact_name: `${contact.first_name} ${contact.last_name}`,
      changes: changes,
    });

    return {
      status: true,
      message: "Contact updated successfully",
      data: {
        contact,
        changes: changes,
      },
    };
  } catch (error) {
    console.error("updateContact error:", error);
    
    await log_audit("error", "CustomerContact", 0, _userId, {
      // @ts-ignore
      error: error.message,
      contact_id,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to update contact: ${error.message}`,
      data: null,
    };
  }
}

module.exports = updateContact;