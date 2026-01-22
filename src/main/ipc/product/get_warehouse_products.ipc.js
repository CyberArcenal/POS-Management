// get_warehouse_products.ipc.js
//@ts-check
const Product = require("../../../entities/Product");
const { AppDataSource } = require("../../db/dataSource");

/**
 * Get products from specific warehouse
 * @param {{ warehouseId: any; filters?: {}; }} params
 */
async function getWarehouseProducts(params) {
  try {
    const { warehouseId, filters = {} } = params;
    
    if (!warehouseId) {
      return {
        status: false,
        message: "Warehouse ID is required",
        data: null
      };
    }

    const productRepo = AppDataSource.getRepository(Product);
    
    // Build query
    const queryBuilder = productRepo.createQueryBuilder('product')
      .where('product.warehouse_id = :warehouseId', { warehouseId })
      .andWhere('product.is_deleted = :isDeleted', { isDeleted: false });
    
    // Apply filters
    // @ts-ignore
    if (filters.is_active !== undefined) {
      // @ts-ignore
      queryBuilder.andWhere('product.is_active = :isActive', { isActive: filters.is_active });
    }
    
    // @ts-ignore
    if (filters.category_name) {
      queryBuilder.andWhere('product.category_name LIKE :category', { 
        // @ts-ignore
        category: `%${filters.category_name}%` 
      });
    }
    
    // @ts-ignore
    if (filters.search) {
      queryBuilder.andWhere(
        '(product.name LIKE :search OR product.sku LIKE :search OR product.barcode LIKE :search)',
        // @ts-ignore
        { search: `%${filters.search}%` }
      );
    }
    
    // Order and paginate
    queryBuilder.orderBy('product.name', 'ASC');
    
    // @ts-ignore
    if (filters.limit) {
      // @ts-ignore
      queryBuilder.take(filters.limit);
      // @ts-ignore
      if (filters.offset) {
        // @ts-ignore
        queryBuilder.skip(filters.offset);
      }
    }
    
    const [products, total] = await queryBuilder.getManyAndCount();
    
    return {
      status: true,
      message: `Found ${products.length} products in warehouse`,
      data: {
        products,
        total,
        warehouseId
      }
    };
    
  } catch (error) {
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null
    };
  }
}

module.exports = getWarehouseProducts;