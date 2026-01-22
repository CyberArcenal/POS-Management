// customers/contacts/get_all.ipc.js
//@ts-check
const { CustomerContact } = require("../../../../entities/CustomerContact");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {number} customer_id
 * @param {number} userId
 */
async function getCustomerContacts(customer_id, userId) {
  try {
    const contactRepo = AppDataSource.getRepository(CustomerContact);

    const contacts = await contactRepo.find({
      where: { customer_id },
      order: { 
        is_default_contact: "DESC",
        created_at: "ASC" 
      },
    });

    // Log activity
    await log_audit("fetch_contacts", "Customer", customer_id, userId, {
      contact_count: contacts.length,
      has_default: contacts.some(c => c.is_default_contact),
    });

    return {
      status: true,
      message: "Customer contacts fetched successfully",
      data: contacts,
      summary: {
        total_contacts: contacts.length,
        default_contact: contacts.find(c => c.is_default_contact),
        contact_types: contacts.reduce((acc, contact) => {
          // @ts-ignore
          acc[contact.contact_type] = (acc[contact.contact_type] || 0) + 1;
          return acc;
        }, {}),
      },
    };
  } catch (error) {
    console.error("getCustomerContacts error:", error);

    await log_audit("error", "CustomerContact", 0, userId, {
      customer_id,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to fetch customer contacts: ${error.message}`,
      data: [],
      summary: {
        total_contacts: 0,
        default_contact: null,
        contact_types: {},
      },
    };
  }
}

module.exports = getCustomerContacts;