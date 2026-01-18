//@ts-check
const Product = require("../../../../entities/Product");
const SaleItem = require("../../../../entities/SaleItem");
// @ts-ignore
// @ts-ignore
const { log_audit } = require("../../../../utils/auditLogger");
// @ts-ignore
// @ts-ignore
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get product statistics
 * @param {Object} dateRange
 * @param {number} userId
 */
// @ts-ignore
async function getProductStats(dateRange, userId) {
  try {
    const productRepo = AppDataSource.getRepository(Product);
    const saleItemRepo = AppDataSource.getRepository(SaleItem);

    // Get basic stats
    const totalProducts = await productRepo.count({
      where: { is_deleted: false }
    });

    const activeProducts = await productRepo.count({
      where: { is_deleted: false, is_active: true }
    });

    const inStockProducts = await productRepo.count({
      where: { is_deleted: false, stock: { gt: 0 } }
    });

    const outOfStockProducts = await productRepo.count({
      where: { is_deleted: false, stock: 0 }
    });

    const lowStockProducts = await productRepo.count({
      where: {
        is_deleted: false,
        stock: () => "stock <= min_stock AND stock > 0"
      }
    });

    const productsWithInventoryLink = await productRepo.count({
      where: { is_deleted: false, stock_item_id: { not: null } }
    });

    // Calculate total inventory value and cost
    const inventoryStats = await productRepo
      .createQueryBuilder("product")
      .select([
        "SUM(product.stock * product.price) as totalValue",
        "SUM(product.stock * product.cost_price) as totalCost",
        "SUM(product.stock) as totalStock"
      ])
      .where("product.is_deleted = :is_deleted", { is_deleted: false })
      .getRawOne();

    // Get categories count
    const categories = await productRepo
      .createQueryBuilder("product")
      .select("product.category_name", "category")
      .addSelect("COUNT(*)", "count")
      .where("product.is_deleted = :is_deleted", { is_deleted: false })
      .andWhere("product.category_name IS NOT NULL")
      .groupBy("product.category_name")
      .orderBy("count", "DESC")
      .limit(10)
      .getRawMany();

    // Get suppliers count
    const suppliers = await productRepo
      .createQueryBuilder("product")
      .select("product.supplier_name", "supplier")
      .addSelect("COUNT(*)", "count")
      .where("product.is_deleted = :is_deleted", { is_deleted: false })
      .andWhere("product.supplier_name IS NOT NULL")
      .groupBy("product.supplier_name")
      .orderBy("count", "DESC")
      .limit(10)
      .getRawMany();

    // Get top selling products (if date range provided)
    let topSellingProducts = [];
    // @ts-ignore
    if (dateRange && dateRange.start && dateRange.end) {
      topSellingProducts = await saleItemRepo
        .createQueryBuilder("saleItem")
        .innerJoin("saleItem.product", "product")
        .innerJoin("saleItem.sale", "sale")
        .select([
          "product.id as product_id",
          "product.name as product_name",
          "product.sku as sku",
          "product.category_name as category",
          "SUM(saleItem.quantity) as total_quantity",
          "SUM(saleItem.total_price) as total_revenue"
        ])
        .where("sale.datetime BETWEEN :start AND :end", {
          // @ts-ignore
          start: dateRange.start,
          // @ts-ignore
          end: dateRange.end
        })
        .andWhere("sale.status = :status", { status: "completed" })
        .groupBy("product.id")
        .orderBy("total_quantity", "DESC")
        .limit(10)
        .getRawMany();
    }

    return {
      status: true,
      message: "Product statistics fetched",
      data: {
        summary: {
          totalProducts,
          activeProducts,
          inStockProducts,
          outOfStockProducts,
          lowStockProducts,
          productsWithInventoryLink,
          inventoryValue: parseFloat(inventoryStats.totalValue || 0),
          inventoryCost: parseFloat(inventoryStats.totalCost || 0),
          totalStock: parseFloat(inventoryStats.totalStock || 0),
          potentialProfit: parseFloat(inventoryStats.totalValue || 0) - parseFloat(inventoryStats.totalCost || 0)
        },
        categories,
        suppliers,
        topSellingProducts,
        dateRange
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

module.exports = getProductStats;