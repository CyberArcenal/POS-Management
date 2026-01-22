// customers/create.ipc.js
//@ts-check
const { Customer } = require("../../../entities/Customer");
const { log_audit } = require("../../../utils/auditLogger");

/**
 * @param {Object} params
 * @param {{ manager: { getRepository: (arg0: any) => any; }; }} queryRunner
 */
async function createCustomer(params, queryRunner) {
  const {
    // @ts-ignore
    customer_data,
    // @ts-ignore
    _userId,
  } = params;

  try {
    const customerRepo = queryRunner.manager.getRepository(Customer);

    // Generate unique customer code
    const customerCode = `CUST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create customer
    const customer = customerRepo.create({
      ...customer_data,
      customer_code: customerCode,
      created_by: _userId,
      status: "active",
    });

    await customerRepo.save(customer);

    // Log activity
    await log_audit("create", "Customer", customer.id, _userId, {
      customer_code: customerCode,
      customer_name:
        customer.display_name || `${customer.first_name} ${customer.last_name}`,
      customer_type: customer.customer_type,
    });

    return {
      status: true,
      message: "Customer created successfully",
      data: {
        customer,
        customer_code: customerCode,
        timestamp: customer.created_at,
      },
    };
  } catch (error) {
    console.error("createCustomer error:", error);

    await log_audit("error", "Customer", 0, _userId, {
      // @ts-ignore
      error: error.message,
      customer_data: JSON.stringify(customer_data),
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to create customer: ${error.message}`,
      data: null,
    };
  }
}

module.exports = createCustomer;
