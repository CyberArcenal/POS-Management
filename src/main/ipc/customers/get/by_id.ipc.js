// customers/get/by_id.ipc.js
//@ts-check
const Customer = require("../../../../entities/Customer");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {number} customer_id
 * @param {number} userId
 */
async function getCustomerById(customer_id, userId) {
  try {
    const customerRepo = AppDataSource.getRepository(Customer);

    const customer = await customerRepo.findOne({
      where: { id: customer_id },
      relations: [
        "sales",
        "sales.items",
        "contacts",
        "transactions"
      ],
    });

    if (!customer) {
      return {
        status: false,
        message: "Customer not found",
        data: null,
      };
    }

    // Calculate customer statistics
    // @ts-ignore
    const salesStats = customer.sales.reduce((/** @type {{ total_sales: number; total_revenue: number; average_sale: number; }} */ stats, /** @type {{ total: string; }} */ sale) => {
      stats.total_sales += 1;
      stats.total_revenue += parseFloat(sale.total) || 0;
      stats.average_sale = stats.total_revenue / stats.total_sales;
      return stats;
    }, { total_sales: 0, total_revenue: 0, average_sale: 0 });

    // Audit log
    await log_audit("fetch_by_id", "Customer", customer_id, userId, {
      customer_code: customer.customer_code,
      // @ts-ignore
      has_sales: customer.sales.length > 0,
      // @ts-ignore
      has_contacts: customer.contacts.length > 0,
    });

    return {
      status: true,
      message: "Customer fetched successfully",
      data: {
        ...customer,
        statistics: salesStats,
      },
    };
  } catch (error) {
    console.error("getCustomerById error:", error);

    await log_audit("error", "Customer", 0, userId, {
      customer_id,
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

module.exports = getCustomerById;