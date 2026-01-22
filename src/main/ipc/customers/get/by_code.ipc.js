// customers/get/by_code.ipc.js
//@ts-check
const Customer = require("../../../../entities/Customer");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {string} customer_code
 * @param {number} userId
 */
async function getCustomerByCode(customer_code, userId) {
  try {
    const customerRepo = AppDataSource.getRepository(Customer);

    const customer = await customerRepo.findOne({
      where: { customer_code: customer_code },
      relations: ["sales", "contacts"],
    });

    if (!customer) {
      return {
        status: false,
        message: "Customer not found",
        data: null,
      };
    }

    // Audit log
    // @ts-ignore
    await log_audit("fetch_by_code", "Customer", customer.id, userId, {
      customer_code: customer.customer_code,
      customer_name: customer.display_name || `${customer.first_name} ${customer.last_name}`,
    });

    return {
      status: true,
      message: "Customer fetched successfully",
      data: customer,
    };
  } catch (error) {
    console.error("getCustomerByCode error:", error);

    await log_audit("error", "Customer", 0, userId, {
      customer_code,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to fetch customer: ${error.message}`,
      data: null,
    };
  }
}

module.exports = getCustomerByCode;