// src/ipc/product/update.ipc.js
const PriceHistory = require("../../../entities/PriceHistory");
const { Product } = require("../../../entities/Product");
const { AppDataSource } = require("../../db/dataSource");

/**
 * Update existing product
 * @param {{
 *   id: number,
 *   productData: object,
 *   _userId: number,
 *   reason?: string
 * }} params
 * @param {import("typeorm").QueryRunner} queryRunner
 */
module.exports = async function updateProduct(params, queryRunner = null) {
  const { id, productData, _userId, reason } = params;
  
  try {
    const productRepo = queryRunner 
      ? queryRunner.manager.getRepository(Product)
      : AppDataSource.getRepository(Product);
    
    const priceHistoryRepo = queryRunner 
      ? queryRunner.manager.getRepository(PriceHistory)
      : AppDataSource.getRepository(PriceHistory);
    
    // Find existing product
    const product = await productRepo.findOne({ 
      where: { id, is_deleted: false } 
    });
    
    if (!product) {
      return {
        status: false,
        message: `Product with ID ${id} not found`,
        data: null,
      };
    }
    
    // Check if SKU is being changed and if new SKU already exists
    if (productData.sku && productData.sku !== product.sku) {
      const skuExists = await productRepo.findOne({
        where: { sku: productData.sku, is_deleted: false },
      });
      
      if (skuExists) {
        return {
          status: false,
          message: `SKU "${productData.sku}" already exists`,
          data: null,
        };
      }
    }
    
    // Check if barcode is being changed and if new barcode already exists
    if (productData.barcode && productData.barcode !== product.barcode) {
      const barcodeExists = await productRepo.findOne({
        where: { barcode: productData.barcode, is_deleted: false },
      });
      
      if (barcodeExists) {
        return {
          status: false,
          message: `Barcode "${productData.barcode}" already exists`,
          data: null,
        };
      }
    }
    
    // Track price changes
    if (productData.selling_price && productData.selling_price !== product.selling_price) {
      const priceHistory = priceHistoryRepo.create({
        product_id: product.id,
        old_price: product.selling_price,
        new_price: productData.selling_price,
        change_type: reason || 'manual',
        change_reason: `Price updated by user ${_userId}`,
        changed_by_id: _userId,
      });
      
      await priceHistoryRepo.save(priceHistory);
    }
    
    // Update product
    Object.assign(product, productData, {
      updated_by: _userId,
      updated_at: new Date(),
    });
    
    const updatedProduct = await productRepo.save(product);
    
    // Log activity
    if (_userId) {
      const activityRepo = queryRunner 
        ? queryRunner.manager.getRepository(require("../../../entities/UserActivity"))
        : AppDataSource.getRepository(require("../../../entities/UserActivity"));
      
      await activityRepo.save({
        user_id: _userId,
        action: "product_update",
        entity: "Product",
        entity_id: updatedProduct.id,
        description: `Updated product: ${updatedProduct.name}`,
      });
    }
    
    return {
      status: true,
      message: "Product updated successfully",
      data: updatedProduct,
    };
    
  } catch (error) {
    console.error("Update product error:", error);
    return {
      status: false,
      message: error.message || "Failed to update product",
      data: null,
    };
  }
};