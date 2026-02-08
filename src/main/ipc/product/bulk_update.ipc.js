// src/ipc/product/bulk_update.ipc.js
// @ts-nocheck
const { Product } = require("../../../entities/Product");
const { AppDataSource } = require("../../db/dataSource");

/**
 * Bulk update products (for category changes, status updates, etc.)
 * @param {{
 *   product_ids: number[],
 *   update_data: object,
 *   update_type: string,
 *   _userId: number,
 *   filters?: object
 * }} params
 * @param {import("typeorm").QueryRunner} queryRunner
 */
module.exports = async function bulkUpdateProducts(params, queryRunner = null) {
  const {
    product_ids,
    update_data,
    update_type,
    _userId,
    filters
  } = params;
  
  try {
    if (!update_data || Object.keys(update_data).length === 0) {
      return {
        status: false,
        message: "No update data provided",
        data: null,
      };
    }
    
    const productRepo = queryRunner 
      ? queryRunner.manager.getRepository(Product)
      : AppDataSource.getRepository(Product);
    
    // Determine which products to update
    let whereCondition = { is_deleted: false };
    
    if (product_ids && product_ids.length > 0) {
      whereCondition.id = product_ids;
    } else if (filters) {
      // Build query from filters
      Object.keys(filters).forEach(key => {
        whereCondition[key] = filters[key];
      });
    } else {
      return {
        status: false,
        message: "No products specified for update",
        data: null,
      };
    }
    
    // Find products to update
    const products = await productRepo.find({
      where: whereCondition
    });
    
    if (products.length === 0) {
      return {
        status: false,
        message: "No products found matching criteria",
        data: null,
      };
    }
    
    // Validate update data based on update type
    const validation = validateBulkUpdate(update_type, update_data);
    if (!validation.valid) {
      return {
        status: false,
        message: validation.message,
        data: null,
      };
    }
    
    // Perform bulk update
    const updatedProducts = [];
    const errors = [];
    
    for (const product of products) {
      try {
        // Apply updates
        Object.assign(product, update_data, {
          updated_by: _userId,
          updated_at: new Date(),
        });
        
        // Special handling based on update type
        switch (update_type) {
          case 'status_change':
            if (update_data.status === 'inactive') {
              product.is_active = false;
            } else if (update_data.status === 'active') {
              product.is_active = true;
            }
            break;
            
          case 'category_change':
            // Reset subcategory if category changes
            if (update_data.category_id && update_data.category_id !== product.category_id) {
              product.subcategory_id = null;
            }
            break;
            
          case 'supplier_change':
            // Reset supplier-specific fields
            product.supplier_sku = update_data.supplier_sku || null;
            product.supplier_price = update_data.supplier_price || null;
            break;
        }
        
        const savedProduct = await productRepo.save(product);
        updatedProducts.push(savedProduct);
        
      } catch (error) {
        errors.push({
          product_id: product.id,
          product_name: product.name,
          error: error.message,
        });
      }
    }
    
    // Log activity
    if (_userId && updatedProducts.length > 0) {
      const activityRepo = queryRunner 
        ? queryRunner.manager.getRepository(require("../../../entities/UserActivity"))
        : AppDataSource.getRepository(require("../../../entities/UserActivity"));
      
      await activityRepo.save({
        user_id: _userId,
        action: "bulk_update",
        entity: "Product",
        entity_id: null,
        description: `Bulk updated ${updatedProducts.length} products. Type: ${update_type}`,
        details: JSON.stringify({
          update_type,
          update_data,
          updated_count: updatedProducts.length,
          error_count: errors.length,
        }),
      });
    }
    
    return {
      status: true,
      message: `Bulk update completed. Successful: ${updatedProducts.length}, Failed: ${errors.length}`,
      data: {
        updated_count: updatedProducts.length,
        error_count: errors.length,
        updated_products: updatedProducts.map(p => ({ id: p.id, name: p.name })),
        errors: errors.length > 0 ? errors : null,
        summary: {
          update_type,
          fields_updated: Object.keys(update_data),
          timestamp: new Date(),
        },
      },
    };
    
  } catch (error) {
    console.error("Bulk update error:", error);
    return {
      status: false,
      message: error.message || "Failed to perform bulk update",
      data: null,
    };
  }
};

/**
 * Validate bulk update parameters
 */
function validateBulkUpdate(update_type, update_data) {
  const allowedUpdates = {
    'status_change': ['status'],
    'category_change': ['category_id', 'subcategory_id'],
    'supplier_change': ['supplier_id', 'supplier_sku', 'supplier_price'],
    'price_update': ['selling_price', 'wholesale_price'],
    'tax_update': ['tax_rate', 'tax_type', 'is_taxable'],
    'inventory_update': ['min_stock_level', 'reorder_level', 'max_stock_level'],
    'general_update': ['is_active', 'is_featured', 'is_bestseller', 'tags'],
  };
  
  if (!allowedUpdates[update_type]) {
    return {
      valid: false,
      message: `Invalid update type: ${update_type}`,
    };
  }
  
  const allowedFields = allowedUpdates[update_type];
  const providedFields = Object.keys(update_data);
  
  const invalidFields = providedFields.filter(field => !allowedFields.includes(field));
  if (invalidFields.length > 0) {
    return {
      valid: false,
      message: `Invalid fields for ${update_type}: ${invalidFields.join(', ')}`,
    };
  }
  
  return { valid: true };
}