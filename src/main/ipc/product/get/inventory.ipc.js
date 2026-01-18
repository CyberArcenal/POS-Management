//@ts-check
const Product = require("../../../../entities/Product");
// @ts-ignore
const { log_audit } = require("../../../../utils/auditLogger");
// @ts-ignore
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get detailed inventory information
 * @param {Object} filters
 * @param {number} userId
 */
// @ts-ignore
async function getProductInventory(filters = {}, userId) {
  try {
    const productRepo = AppDataSource.getRepository(Product);
    
    const queryBuilder = productRepo
      .createQueryBuilder("product")
      .where("product.is_deleted = :is_deleted", { is_deleted: false });

    // Apply filters
    // @ts-ignore
    if (filters.stock_level) {
      // @ts-ignore
      switch (filters.stock_level) {
        case 'out_of_stock':
          queryBuilder.andWhere("product.stock = 0");
          break;
        case 'low_stock':
          queryBuilder.andWhere("product.stock <= product.min_stock AND product.stock > 0");
          break;
        case 'in_stock':
          queryBuilder.andWhere("product.stock > product.min_stock");
          break;
      }
    }

    // @ts-ignore
    if (filters.has_inventory_link) {
      queryBuilder.andWhere("product.stock_item_id IS NOT NULL");
    }

    // Calculate inventory value for each product
    const products = await queryBuilder.getMany();
    
    const inventoryData = products.map(product => ({
      ...product,
      // @ts-ignore
      inventoryValue: product.stock * product.price,
      stockStatus: product.stock === 0 
        ? 'out_of_stock' 
        // @ts-ignore
        : product.stock <= product.min_stock 
          ? 'low_stock' 
          : 'in_stock',
      // @ts-ignore
      reorderNeeded: product.stock <= product.min_stock
    }));

    // Calculate totals
    const totals = {
      totalProducts: inventoryData.length,
      totalStockValue: inventoryData.reduce((sum, p) => sum + p.inventoryValue, 0),
      // @ts-ignore
      totalStockQuantity: inventoryData.reduce((sum, p) => sum + p.stock, 0),
      outOfStock: inventoryData.filter(p => p.stock === 0).length,
      // @ts-ignore
      lowStock: inventoryData.filter(p => p.stock > 0 && p.stock <= p.min_stock).length,
      // @ts-ignore
      inStock: inventoryData.filter(p => p.stock > p.min_stock).length
    };

    return {
      status: true,
      message: "Inventory data fetched",
      data: {
        products: inventoryData,
        totals,
        filters
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

module.exports = getProductInventory;