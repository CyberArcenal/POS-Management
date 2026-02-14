// utils/customerUtils.js
function validateCustomerData(data) {
  const errors = [];
  if (!data.name || data.name.trim() === '') {
    errors.push("Customer name is required");
  }
  if (data.loyaltyPointsBalance !== undefined && data.loyaltyPointsBalance < 0) {
    errors.push("Loyalty points balance cannot be negative");
  }
  // Optional: validate email format if contactInfo contains email
  return { valid: errors.length === 0, errors };
}

module.exports = { validateCustomerData };