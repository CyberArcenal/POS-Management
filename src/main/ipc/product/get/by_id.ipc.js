// src/ipc/product/get/by_id.ipc.js
//@ts-check
const { Product } = require("../../../../entities/Product");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get product by ID with related data
 * @param {number} productId
 * @param {number} userId
 */
// @ts-ignore
module.exports = async function getProductById(productId, userId) {
  try {
    const productRepo = AppDataSource.getRepository(Product);
    
    const product = await productRepo.findOne({
      where: { 
        id: productId,
        is_deleted: false 
      },
      relations: [
        'category',
        'brand',
        'supplier',
        'priceHistory',
        'inventoryTransactions',
      ],
      order: {
        // @ts-ignore
        priceHistory: { effective_date: 'DESC' },
        inventoryTransactions: { created_at: 'DESC' }
      }
    });
    
    if (!product) {
      return {
        status: false,
        message: `Product with ID ${productId} not found`,
        data: null,
      };
    }
    
    // Get recent sales data
    const saleItemsRepo = AppDataSource.getRepository(require("../../../../entities/SaleItem"));
    const recentSales = await saleItemsRepo.find({
      where: { product_id: productId },
      order: { created_at: 'DESC' },
      take: 10,
      relations: ['sale']
    });
    
    // Get stock movement summary
    const inventoryLogRepo = AppDataSource.getRepository(require("../../../../entities/InventoryTransactionLogs"));
    const stockMovement = await inventoryLogRepo.createQueryBuilder('log')
      .select('log.action, SUM(log.change_amount) as total_change, COUNT(*) as transaction_count')
      .where('log.product_id = :productId', { productId: productId.toString() })
      .groupBy('log.action')
      .getRawMany();
    
    return {
      status: true,
      message: "Product retrieved successfully",
      data: {
        product,
        recentSales,
        stockMovement,
        computed: {
          profit_margin: product.cost_price ? 
            // @ts-ignore
            ((product.selling_price - product.cost_price) / product.cost_price * 100).toFixed(2) : null,
          days_since_last_sale: product.last_sold_at ? 
            // @ts-ignore
            Math.floor((new Date() - new Date(product.last_sold_at)) / (1000 * 60 * 60 * 24)) : null,
          // @ts-ignore
          turnover_rate: product.total_sold > 0 ? 
            // @ts-ignore
            (product.total_sold / (product.stock || 1)).toFixed(2) : 0,
        }
      },
    };
    
  } catch (error) {
    console.error("Get product by ID error:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to retrieve product",
      data: null,
    };
  }
};