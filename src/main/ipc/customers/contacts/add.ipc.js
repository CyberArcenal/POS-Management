// customers/contacts/add.ipc.js
//@ts-check
const CustomerContact = require("../../../../entities/CustomerContact");
const Customer = require("../../../../entities/Customer");
const { log_audit } = require("../../../../utils/auditLogger");

/**
 * @param {Object} params
 * @param {{ manager: { getRepository: (arg0: any) => any; }; }} queryRunner
 */
async function addContact(params, queryRunner) {
  const { 
    // @ts-ignore
    customer_id,
    // @ts-ignore
    contact_data,
    // @ts-ignore
    _userId 
  } = params;
  
  try {
    const contactRepo = queryRunner.manager.getRepository(CustomerContact);
    const customerRepo = queryRunner.manager.getRepository(Customer);

    // Verify customer exists
    const customer = await customerRepo.findOne({
      where: { id: customer_id }
    });

    if (!customer) {
      return {
        status: false,
        message: "Customer not found",
        data: null,
      };
    }

    // If this is set as default, unset any existing default
    if (contact_data.is_default_contact === true) {
      await contactRepo.update(
        { customer_id, is_default_contact: true },
        { is_default_contact: false }
      );
    }

    // Create contact
    const contact = contactRepo.create({
      customer_id,
      ...contact_data,
    });

    await contactRepo.save(contact);

    // Log activity
    await log_audit("add_contact", "Customer", customer_id, _userId, {
      customer_code: customer.customer_code,
      contact_id: contact.id,
      contact_name: `${contact.first_name} ${contact.last_name}`,
      contact_type: contact.contact_type,
      is_default: contact.is_default_contact,
    });

    return {
      status: true,
      message: "Contact added successfully",
      data: {
        contact,
        customer: {
          id: customer.id,
          code: customer.customer_code,
          name: customer.display_name || `${customer.first_name} ${customer.last_name}`,
        },
      },
    };
  } catch (error) {
    console.error("addContact error:", error);
    
    await log_audit("error", "CustomerContact", 0, _userId, {
      // @ts-ignore
      error: error.message,
      customer_id,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to add contact: ${error.message}`,
      data: null,
    };
  }
}

module.exports = addContact;