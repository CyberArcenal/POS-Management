// utils/saleUtils.js
function validateSaleData(data) {
  const errors = [];
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push("At least one item is required");
  } else {
    data.items.forEach((item, idx) => {
      if (!item.productId) errors.push(`Item ${idx+1}: productId is required`);
      if (!item.quantity || item.quantity <= 0) errors.push(`Item ${idx+1}: quantity must be positive`);
    });
  }
  if (data.loyaltyRedeemed && data.loyaltyRedeemed < 0) errors.push("Loyalty redeemed cannot be negative");
  return { valid: errors.length === 0, errors };
}

function calculateSaleTotals({ items, loyaltyRedeemed = 0, subtotal }) {
  const totalDiscount = items.reduce((sum, i) => sum + i.discount, 0);
  const totalTax = items.reduce((sum, i) => sum + i.tax, 0);
  const total = subtotal - totalDiscount + totalTax - loyaltyRedeemed;
  return { subtotal, totalDiscount, totalTax, total };
}

module.exports = { validateSaleData, calculateSaleTotals };