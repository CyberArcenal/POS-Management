// utils/productUtils.js
function validateProductData(data) {
  const errors = [];
  if (!data.sku || data.sku.trim() === '') errors.push('SKU is required');
  if (!data.name || data.name.trim() === '') errors.push('Name is required');
  if (data.price === undefined || data.price === null) errors.push('Price is required');
  else if (data.price <= 0) errors.push('Price must be positive');
  if (data.stockQty !== undefined && data.stockQty < 0) errors.push('Stock quantity cannot be negative');
  return { valid: errors.length === 0, errors };
}

module.exports = { validateProductData };