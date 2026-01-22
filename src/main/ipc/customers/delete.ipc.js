// customers/delete.ipc.js
//@ts-check
const { Customer } = require("../../../entities/Customer");
const { log_audit } = require("../../../utils/auditLogger");

/**
 * @param {Object} params
 * @param {{ manager: { getRepository: (arg0: any) => any; }; }} queryRunner
 */
async function deleteCustomer(params, queryRunner) {
  const {
    // @ts-ignore
    customer_id,
    // @ts-ignore
    reason = "",
    // @ts-ignore
    _userId,
  } = params;

  try {
    const customerRepo = queryRunner.manager.getRepository(Customer);

    // Find customer
    const customer = await customerRepo.findOne({
      where: { id: customer_id },
      relations: ["sales"],
    });

    if (!customer) {
      return {
        status: false,
        message: "Customer not found",
        data: null,
      };
    }

    // Check if customer has sales
    if (customer.sales && customer.sales.length > 0) {
      // Soft delete instead of hard delete
      customer.status = "inactive";
      await customerRepo.save(customer);

      await log_audit("deactivate", "Customer", customer.id, _userId, {
        customer_code: customer.customer_code,
        reason: "Has existing sales, soft deleted",
        sales_count: customer.sales.length,
      });

      return {
        status: true,
        message:
          "Customer has existing sales. Customer status changed to inactive.",
        data: {
          customer_id: customer.id,
          customer_code: customer.customer_code,
          status: "inactive",
          sales_count: customer.sales.length,
        },
      };
    }

    // Hard delete if no sales
    await customerRepo.remove(customer);

    // Log activity
    await log_audit("delete", "Customer", customer_id, _userId, {
      customer_code: customer.customer_code,
      reason: reason,
      deleted_by: _userId,
    });

    return {
      status: true,
      message: "Customer deleted successfully",
      data: {
        customer_id,
        customer_code: customer.customer_code,
        deleted_at: new Date(),
      },
    };
  } catch (error) {
    console.error("deleteCustomer error:", error);

    await log_audit("error", "Customer", 0, _userId, {
      // @ts-ignore
      error: error.message,
      customer_id,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to delete customer: ${error.message}`,
      data: null,
    };
  }
}

module.exports = deleteCustomer;
