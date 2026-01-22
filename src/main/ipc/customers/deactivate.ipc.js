// customers/deactivate.ipc.js
//@ts-check
const { Customer } = require("../../../entities/Customer");
const { log_audit } = require("../../../utils/auditLogger");

/**
 * @param {Object} params
 * @param {{ manager: { getRepository: (arg0: any) => any; }; }} queryRunner
 */
async function deactivateCustomer(params, queryRunner) {
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
    });

    if (!customer) {
      return {
        status: false,
        message: "Customer not found",
        data: null,
      };
    }

    if (customer.status === "inactive") {
      return {
        status: true,
        message: "Customer is already inactive",
        data: {
          customer,
        },
      };
    }

    // Deactivate customer
    customer.status = "inactive";
    customer.updated_by = _userId;
    customer.updated_at = new Date();

    await customerRepo.save(customer);

    // Log activity
    await log_audit("deactivate", "Customer", customer.id, _userId, {
      customer_code: customer.customer_code,
      previous_status: customer.status,
      new_status: "inactive",
      reason: reason,
    });

    return {
      status: true,
      message: "Customer deactivated successfully",
      data: {
        customer,
        timestamp: customer.updated_at,
      },
    };
  } catch (error) {
    console.error("deactivateCustomer error:", error);

    await log_audit("error", "Customer", 0, _userId, {
      // @ts-ignore
      error: error.message,
      customer_id,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to deactivate customer: ${error.message}`,
      data: null,
    };
  }
}

module.exports = deactivateCustomer;
