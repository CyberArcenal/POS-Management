// src/ipc/product/get/by_barcode.ipc.js
//@ts-check
const { Product } = require("../../../../entities/Product");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get product by barcode (for POS scanning)
 * @param {string} barcode
 * @param {number} userId
 */
// @ts-ignore
module.exports = async function getProductsByBarcode(barcode, userId) {
  try {
    if (!barcode || barcode.trim() === '') {
      return {
        status: false,
        message: "Barcode is required",
        data: null,
      };
    }
    
    const productRepo = AppDataSource.getRepository(Product);
    
    // Search by exact barcode first
    let product = await productRepo.findOne({
      where: { 
        barcode: barcode,
        is_deleted: false,
        is_active: true 
      },
      relations: ['category']
    });
    
    // If not found, search by SKU
    if (!product) {
      product = await productRepo.findOne({
        where: { 
          sku: barcode,
          is_deleted: false,
          is_active: true 
        },
        relations: ['category']
      });
    }
    
    // If still not found, search by UPC
    if (!product) {
      product = await productRepo.findOne({
        where: { 
          upc: barcode,
          is_deleted: false,
          is_active: true 
        },
        relations: ['category']
      });
    }
    
    if (!product) {
      return {
        status: false,
        message: `Product with barcode/SKU "${barcode}" not found`,
        data: null,
      };
    }
    
    // Check stock availability
    // @ts-ignore
    const availableStock = Math.max(0, product.stock - product.reserved_stock);
    const isOutOfStock = availableStock <= 0;
    // @ts-ignore
    const isLowStock = availableStock <= product.min_stock_level;
    
    return {
      status: true,
      message: "Product found",
      data: {
        ...product,
        available_stock: availableStock,
        is_out_of_stock: isOutOfStock,
        is_low_stock: isLowStock,
        stock_status: isOutOfStock ? 'out_of_stock' : 
                     isLowStock ? 'low_stock' : 'in_stock'
      },
    };
    
  } catch (error) {
    console.error("Get product by barcode error:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to search product",
      data: null,
    };
  }
};