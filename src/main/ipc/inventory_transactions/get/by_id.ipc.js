// inventory_transactions/get/by_id.ipc.js
//@ts-check
const InventoryTransactionLog = require("../../../../entities/InventoryTransactionLogs");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {number} id
 * @param {number} userId
 */
async function getTransactionLogById(id, userId) {
  try {
    if (!id) {
      return {
        status: false,
        message: "Transaction Log ID is required",
        data: null,
      };
    }

    const transactionRepo = AppDataSource.getRepository(InventoryTransactionLog);

    const transaction = await transactionRepo.findOne({
      where: { id },
      relations: [
        "product",
        "performed_by",
        "location",
      ],
    });

    if (!transaction) {
      return {
        status: false,
        message: `Transaction log with ID ${id} not found`,
        data: null,
      };
    }

    // Calculate impact metrics
    const impact = {
      // @ts-ignore
      stock_change_percentage: transaction.quantity_before > 0 ? 
        // @ts-ignore
        (transaction.change_amount / transaction.quantity_before) * 100 : 0,
      // @ts-ignore
      price_change_percentage: transaction.price_before && transaction.price_after && transaction.price_before > 0 ?
        // @ts-ignore
        ((transaction.price_after - transaction.price_before) / transaction.price_before) * 100 : 0,
      // @ts-ignore
      monetary_value_change: transaction.change_amount * (transaction.price_before || 0),
    };

    // Determine transaction type
    const transactionType = getTransactionType(transaction.action);

    await log_audit("view", "InventoryTransactionLog", id, userId, {
      product_id: transaction.product_id,
      action: transaction.action,
      change_amount: transaction.change_amount,
    });

    return {
      status: true,
      message: "Transaction log retrieved successfully",
      data: {
        transaction,
        impact,
        classification: {
          type: transactionType,
          // @ts-ignore
          is_increase: transaction.change_amount > 0,
          // @ts-ignore
          is_decrease: transaction.change_amount < 0,
          is_price_change: transaction.price_before !== transaction.price_after,
          is_stock_change: transaction.change_amount !== 0,
        },
        context: {
          // @ts-ignore
          performed_by: transaction.performed_by ? {
            // @ts-ignore
            id: transaction.performed_by.id,
            // @ts-ignore
            username: transaction.performed_by.username,
            // @ts-ignore
            display_name: transaction.performed_by.display_name,
          } : null,
          // @ts-ignore
          location: transaction.location ? {
            // @ts-ignore
            id: transaction.location.id,
            // @ts-ignore
            name: transaction.location.name,
          } : null,
          // @ts-ignore
          product: transaction.product ? {
            // @ts-ignore
            id: transaction.product.id,
            // @ts-ignore
            name: transaction.product.name,
            // @ts-ignore
            sku: transaction.product.sku,
            // @ts-ignore
            current_stock: transaction.product.stock,
          } : null,
        },
      },
    };
  } catch (error) {
    console.error("getTransactionLogById error:", error);

    await log_audit("error", "InventoryTransactionLog", id, userId, {
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to get transaction log: ${error.message}`,
      data: null,
    };
  }
}

/**
 * Determine transaction type based on action
 */
// @ts-ignore
function getTransactionType(action) {
  const increaseActions = [
    'RETURN', 'TRANSFER_IN', 'REPLENISHMENT', 'FOUND',
    'QUICK_INCREASE', 'BULK_INCREASE', 'PURCHASE_RECEIVE'
  ];
  
  const decreaseActions = [
    'SALE', 'ORDER_ALLOCATION', 'ORDER_CANCELLATION', 'TRANSFER_OUT',
    'DAMAGE', 'THEFT', 'EXPIRY', 'QUICK_DECREASE', 'BULK_DECREASE',
    'PURCHASE_CANCEL'
  ];
  
  const adjustmentActions = [
    'MANUAL_ADJUSTMENT', 'STOCK_TAKE', 'CORRECTION',
    'VARIANT_ADJUSTMENT', 'STOCK_SYNC'
  ];
  
  const priceActions = [
    'PRICE_CHANGE'
  ];
  
  const productActions = [
    'PRODUCT_CREATED', 'PRODUCT_UPDATED', 'PRODUCT_ARCHIVED', 'PRODUCT_RESTORED',
    'CATEGORY_CHANGE', 'SUPPLIER_CHANGE'
  ];

  if (increaseActions.includes(action)) return 'stock_increase';
  if (decreaseActions.includes(action)) return 'stock_decrease';
  if (adjustmentActions.includes(action)) return 'stock_adjustment';
  if (priceActions.includes(action)) return 'price_change';
  if (productActions.includes(action)) return 'product_change';
  
  return 'other';
}

module.exports = getTransactionLogById;