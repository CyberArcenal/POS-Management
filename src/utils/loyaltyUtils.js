// utils/loyaltyUtils.js
function validateLoyaltyTransaction(data) {
  const errors = [];
  if (!data.customerId) {
    errors.push("customerId is required");
  }
  if (data.pointsChange === undefined || data.pointsChange === null) {
    errors.push("pointsChange is required");
  } else if (!Number.isInteger(data.pointsChange) || data.pointsChange === 0) {
    errors.push("pointsChange must be a non-zero integer");
  }
  if (data.notes && typeof data.notes !== "string") {
    errors.push("notes must be a string");
  }
  return { valid: errors.length === 0, errors };
}

module.exports = { validateLoyaltyTransaction };