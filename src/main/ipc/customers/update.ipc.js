// customers/update.ipc.js
//@ts-check
const { Customer } = require("../../../entities/Customer");
const { log_audit } = require("../../../utils/auditLogger");

/**
 * @param {Object} params
 * @param {{ manager: { getRepository: (arg0: any) => any; }; }} queryRunner
 */
async function updateCustomer(params, queryRunner) {
  const {
    // @ts-ignore
    customer_id,
    // @ts-ignore
    customer_data,
    // @ts-ignore
    _userId,
  } = params;

  try {
    const customerRepo = queryRunner.manager.getRepository(Customer);

    // Find existing customer
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

    // Keep track of changes
    const changes = [];
    for (const key in customer_data) {
      if (customer[key] !== customer_data[key]) {
        changes.push({
          field: key,
          old_value: customer[key],
          new_value: customer_data[key],
        });
      }
    }

    // Update customer
    Object.assign(customer, customer_data);
    customer.updated_by = _userId;
    customer.updated_at = new Date();

    await customerRepo.save(customer);

    // Log activity
    await log_audit("update", "Customer", customer.id, _userId, {
      customer_code: customer.customer_code,
      changes: changes,
      updated_by: _userId,
    });

    return {
      status: true,
      message: "Customer updated successfully",
      data: {
        customer,
        changes: changes,
        timestamp: customer.updated_at,
      },
    };
  } catch (error) {
    console.error("updateCustomer error:", error);

    await log_audit("error", "Customer", 0, _userId, {
      // @ts-ignore
      error: error.message,
      customer_id,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to update customer: ${error.message}`,
      data: null,
    };
  }
}

module.exports = updateCustomer;
