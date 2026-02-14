// utils/inventoryUtils.js
function validateInventoryMovement(data) {
  const errors = [];
  if (!data.productId) {
    errors.push("productId is required");
  }
  if (data.qtyChange === undefined || data.qtyChange === null) {
    errors.push("qtyChange is required");
  } else if (!Number.isInteger(data.qtyChange) || data.qtyChange === 0) {
    errors.push("qtyChange must be a non-zero integer");
  }
  if (!data.movementType) {
    errors.push("movementType is required");
  } else if (!["sale", "refund", "adjustment"].includes(data.movementType)) {
    errors.push("movementType must be one of: sale, refund, adjustment");
  }
  return { valid: errors.length === 0, errors };
}

module.exports = { validateInventoryMovement };