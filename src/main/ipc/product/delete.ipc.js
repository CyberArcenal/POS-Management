// src/ipc/product/delete.ipc.js
// @ts-nocheck
const { Product } = require("../../../entities/Product");
const { AppDataSource } = require("../../db/dataSource");

/**
 * Soft delete product
 * @param {{
 *   id: number,
 *   _userId: number,
 *   reason?: string
 * }} params
 * @param {import("typeorm").QueryRunner} queryRunner
 */
module.exports = async function deleteProduct(params, queryRunner = null) {
  const { id, _userId, reason } = params;
  
  try {
    const productRepo = queryRunner 
      ? queryRunner.manager.getRepository(Product)
      : AppDataSource.getRepository(Product);
    
    // Find product
    const product = await productRepo.findOne({ 
      where: { id, is_deleted: false } 
    });
    
    if (!product) {
      return {
        status: false,
        message: `Product with ID ${id} not found or already deleted`,
        data: null,
      };
    }
    
    // Check if product has sales
    const saleItemsRepo = queryRunner 
      ? queryRunner.manager.getRepository(require("../../../entities/SaleItem"))
      : AppDataSource.getRepository(require("../../../entities/SaleItem"));
    
    const hasSales = await saleItemsRepo.count({
      where: { product_id: id }
    });
    
    if (hasSales > 0) {
      return {
        status: false,
        message: "Cannot delete product with existing sales history. Consider deactivating instead.",
        data: null,
      };
    }
    
    // Soft delete (set is_deleted flag)
    product.is_deleted = true;
    product.deleted_at = new Date();
    product.deleted_by = _userId;
    product.is_active = false;
    product.status = 'inactive';
    
    await productRepo.save(product);
    
    // Log activity
    if (_userId) {
      const activityRepo = queryRunner 
        ? queryRunner.manager.getRepository(require("../../../entities/UserActivity"))
        : AppDataSource.getRepository(require("../../../entities/UserActivity"));
      
      await activityRepo.save({
        user_id: _userId,
        action: "product_delete",
        entity: "Product",
        entity_id: product.id,
        description: `Deleted product: ${product.name}${reason ? ` (Reason: ${reason})` : ''}`,
      });
    }
    
    return {
      status: true,
      message: "Product deleted successfully",
      data: { id: product.id, name: product.name },
    };
    
  } catch (error) {
    console.error("Delete product error:", error);
    return {
      status: false,
      message: error.message || "Failed to delete product",
      data: null,
    };
  }
};