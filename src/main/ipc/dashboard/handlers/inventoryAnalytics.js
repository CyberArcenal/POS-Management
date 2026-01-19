// dashboard/handlers/inventoryAnalytics.js
//@ts-check

const { calculateStockUrgency } = require("./utils");

module.exports = {
  /**
     * @param {{ product: any; inventory: any; }} repositories
     * @param {any} params
     */
  async getInventoryOverview(repositories, params) {
    const { product: productRepo, inventory: inventoryRepo } = repositories;

    const inventoryStats = await productRepo.createQueryBuilder("product")
      .select([
        "COUNT(*) as totalProducts",
        "SUM(CASE WHEN product.stock <= 0 THEN 1 ELSE 0 END) as outOfStock",
        "SUM(CASE WHEN product.stock > 0 AND product.stock <= product.min_stock THEN 1 ELSE 0 END) as lowStock",
        "SUM(product.stock) as totalStock",
        "SUM(product.stock * product.price) as totalValue"
      ])
      .where("product.is_active = :active", { active: true })
      .andWhere("product.is_deleted = :deleted", { deleted: false })
      .getRawOne();

    // Recent inventory movements
    const recentMovements = await inventoryRepo.createQueryBuilder("log")
      .leftJoin("log.product", "product")
      .select([
        "log.action",
        "log.change_amount",
        "log.created_at",
        "product.name",
        "product.sku"
      ])
      .orderBy("log.created_at", "DESC")
      .limit(10)
      .getMany();

    // Stock alerts
    const stockAlerts = await productRepo.createQueryBuilder("product")
      .where("product.stock <= product.min_stock")
      .andWhere("product.stock > 0")
      .andWhere("product.is_active = :active", { active: true })
      .orderBy("product.stock", "ASC")
      .limit(10)
      .getMany();

    return {
      status: true,
      message: "Inventory overview retrieved successfully",
      data: {
        summary: {
          totalProducts: parseInt(inventoryStats.totalProducts),
          outOfStock: parseInt(inventoryStats.outOfStock),
          lowStock: parseInt(inventoryStats.lowStock),
          totalStock: parseInt(inventoryStats.totalStock),
          totalValue: parseInt(inventoryStats.totalValue) || 0,
          inStock: parseInt(inventoryStats.totalProducts) - 
                   parseInt(inventoryStats.outOfStock) - 
                   parseInt(inventoryStats.lowStock)
        },
        recentMovements: recentMovements.map((/** @type {{ action: any; change_amount: any; created_at: any; product: { name: any; sku: any; }; }} */ move) => ({
          action: move.action,
          change: move.change_amount,
          date: move.created_at,
          product: move.product?.name,
          sku: move.product?.sku
        })),
        stockAlerts: stockAlerts.map((/** @type {{ id: any; name: any; sku: any; stock: number; min_stock: number; }} */ product) => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          currentStock: product.stock,
          minStock: product.min_stock,
          needed: product.min_stock - product.stock
        }))
      }
    };
  },

  /**
     * @param {{ product: any; }} repositories
     * @param {{ threshold?: 0 | undefined; }} params
     */
  async getLowStockAlerts(repositories, params) {
    const { product: productRepo } = repositories;
    const { threshold = 0 } = params;

    const alerts = await productRepo.createQueryBuilder("product")
      .where("product.stock <= :threshold", { threshold })
      .orWhere("product.stock <= product.min_stock")
      .andWhere("product.is_active = :active", { active: true })
      .andWhere("product.is_deleted = :deleted", { deleted: false })
      .orderBy("product.stock", "ASC")
      .getMany();

    return {
      status: true,
      message: "Low stock alerts retrieved successfully",
      data: {
        alerts: alerts.map((/** @type {{ id: any; name: any; sku: any; stock: any; min_stock: any; category_name: any; supplier_name: any; last_reorder_date: any; reorder_quantity: any; }} */ product) => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          currentStock: product.stock,
          minStock: product.min_stock,
          category: product.category_name,
          supplier: product.supplier_name,
          lastReorder: product.last_reorder_date,
          reorderQuantity: product.reorder_quantity,
          urgency: calculateStockUrgency(product.stock, product.min_stock)
        })),
        summary: {
          critical: alerts.filter((/** @type {{ stock: number; }} */ p) => p.stock === 0).length,
          warning: alerts.filter((/** @type {{ stock: number; min_stock: number; }} */ p) => p.stock > 0 && p.stock <= p.min_stock).length,
          attention: alerts.filter((/** @type {{ stock: number; min_stock: number; }} */ p) => p.stock > p.min_stock && p.stock <= p.min_stock * 2).length
        }
      }
    };
  },

  /**
   * @param {{ inventory: any; }} repositories
   * @param {{ startDate: any; endDate: any; action: any; productId: any; limit?: 50 | undefined; }} params
   */
  async getStockMovement(repositories, params) {
    const { inventory: inventoryRepo } = repositories;
    const { startDate, endDate, action, productId, limit = 50 } = params;

    const query = inventoryRepo.createQueryBuilder("log")
      .leftJoin("log.product", "product")
      .leftJoin("log.performed_by", "user")
      .select([
        "log.id",
        "log.action",
        "log.change_amount",
        "log.quantity_before",
        "log.quantity_after",
        "log.price_before",
        "log.price_after",
        "log.reference_id",
        "log.reference_type",
        "log.notes",
        "log.batch_number",
        "log.expiry_date",
        "log.created_at",
        "product.id as product_id",
        "product.name as product_name",
        "product.sku as product_sku",
        "user.display_name as performed_by_name"
      ])
      .orderBy("log.created_at", "DESC");

    if (startDate && endDate) {
      query.andWhere("log.created_at BETWEEN :start AND :end", {
        start: startDate,
        end: endDate
      });
    }

    if (action) {
      query.andWhere("log.action = :action", { action });
    }

    if (productId) {
      query.andWhere("log.product_id = :productId", { productId });
    }

    if (limit) {
      query.limit(limit);
    }

    const movements = await query.getRawMany();

    // Group by action type for summary
    const actionSummary = await inventoryRepo.createQueryBuilder("log")
      .select(["log.action", "COUNT(*) as count", "SUM(log.change_amount) as totalChange"])
      .where("log.created_at BETWEEN :start AND :end", {
        start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: endDate || new Date()
      })
      .groupBy("log.action")
      .getRawMany();

    return {
      status: true,
      message: "Stock movement retrieved successfully",
      data: {
        movements: movements.map((/** @type {{ log_id: any; log_action: any; log_change_amount: any; log_quantity_before: any; log_quantity_after: any; log_price_before: any; log_price_after: any; log_reference_id: any; log_reference_type: any; log_notes: any; log_batch_number: any; log_expiry_date: any; log_created_at: any; product_id: any; product_name: any; product_sku: any; performed_by_name: any; }} */ move) => ({
          id: move.log_id,
          action: move.log_action,
          changeAmount: move.log_change_amount,
          quantityBefore: move.log_quantity_before,
          quantityAfter: move.log_quantity_after,
          priceBefore: move.log_price_before,
          priceAfter: move.log_price_after,
          referenceId: move.log_reference_id,
          referenceType: move.log_reference_type,
          notes: move.log_notes,
          batchNumber: move.log_batch_number,
          expiryDate: move.log_expiry_date,
          createdAt: move.log_created_at,
          product: {
            id: move.product_id,
            name: move.product_name,
            sku: move.product_sku
          },
          performedBy: move.performed_by_name
        })),
        summary: {
          totalMovements: movements.length,
          actionSummary: actionSummary.map((/** @type {{ log_action: any; count: string; totalChange: string; }} */ a) => ({
            action: a.log_action,
            count: parseInt(a.count),
            totalChange: parseInt(a.totalChange)
          })),
          netChange: movements.reduce((/** @type {any} */ sum, /** @type {{ log_change_amount: any; }} */ move) => sum + move.log_change_amount, 0)
        }
      }
    };
  },

  /**
   * @param {{ product: any; sales: any; saleItem: any; }} repositories
   * @param {{ period?: 30 | undefined; }} params
   */
  async getInventoryTurnover(repositories, params) {
    const { product: productRepo, sales: salesRepo, saleItem: saleItemRepo } = repositories;
    const { period = 30 } = params;
    const startDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000);

    // Get sold products in period
    const soldProducts = await saleItemRepo.createQueryBuilder("saleItem")
      .leftJoin("saleItem.sale", "sale")
      .leftJoin("saleItem.product", "product")
      .select([
        "product.id as product_id",
        "product.name as product_name",
        "product.cost_price as cost_price",
        "product.stock as current_stock",
        "SUM(saleItem.quantity) as total_sold",
        "AVG(saleItem.unit_price) as avg_selling_price"
      ])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime >= :startDate", { startDate })
      .groupBy("product.id")
      .getRawMany();

    // Calculate turnover for each product
    const turnoverData = soldProducts.map((/** @type {{ current_stock: number; total_sold: string; product_id: any; product_name: any; avg_selling_price: string; cost_price: number; }} */ item) => {
      const avgInventory = (item.current_stock + parseInt(item.total_sold)) / 2;
      const turnover = avgInventory > 0 ? parseInt(item.total_sold) / avgInventory : 0;
      const daysInStock = turnover > 0 ? period / turnover : Infinity;

      return {
        productId: item.product_id,
        productName: item.product_name,
        totalSold: parseInt(item.total_sold),
        currentStock: item.current_stock,
        avgSellingPrice: parseFloat(item.avg_selling_price),
        costPrice: item.cost_price,
        turnoverRate: turnover,
        daysInStock: Math.round(daysInStock),
        revenue: parseInt(item.total_sold) * parseFloat(item.avg_selling_price),
        profit: item.cost_price ? 
          (parseFloat(item.avg_selling_price) - item.cost_price) * parseInt(item.total_sold) : null
      };
    });

    // Overall turnover metrics
    const totalCostOfGoodsSold = turnoverData.reduce((/** @type {number} */ sum, /** @type {{ costPrice: any; totalSold: number; }} */ item) => 
      sum + (item.costPrice || 0) * item.totalSold, 0);
    const totalRevenue = turnoverData.reduce((/** @type {any} */ sum, /** @type {{ revenue: any; }} */ item) => sum + item.revenue, 0);
    const avgInventoryValue = await productRepo.createQueryBuilder("product")
      .select("SUM(product.stock * product.cost_price) as value")
      .where("product.is_active = :active", { active: true })
      .getRawOne();

    const overallTurnover = avgInventoryValue.value > 0 ? 
      totalCostOfGoodsSold / avgInventoryValue.value : 0;

    return {
      status: true,
      message: "Inventory turnover retrieved successfully",
      data: {
        periodDays: period,
        products: turnoverData.sort((/** @type {{ turnoverRate: number; }} */ a, /** @type {{ turnoverRate: number; }} */ b) => b.turnoverRate - a.turnoverRate),
        summary: {
          overallTurnoverRate: overallTurnover,
          totalCostOfGoodsSold,
          totalRevenue,
          avgInventoryValue: parseFloat(avgInventoryValue.value) || 0,
          avgDaysInStock: turnoverData.reduce((/** @type {any} */ sum, /** @type {{ daysInStock: any; }} */ item) => sum + item.daysInStock, 0) / turnoverData.length,
          fastMovingProducts: turnoverData.filter((/** @type {{ turnoverRate: number; }} */ p) => p.turnoverRate > 1).length,
          slowMovingProducts: turnoverData.filter((/** @type {{ turnoverRate: number; }} */ p) => p.turnoverRate < 0.5).length
        }
      }
    };
  },

  /**
   * @param {{ inventory: any; product: any; }} repositories
   * @param {{ daysAhead?: 30 | undefined; includeExpired?: false | undefined; }} params
   */
  async getExpiringProducts(repositories, params) {
    const { inventory: inventoryRepo, product: productRepo } = repositories;
    const { daysAhead = 30, includeExpired = false } = params;
    const thresholdDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);

    // Get products with batch/expiry info from transaction logs
    const expiringProducts = await inventoryRepo.createQueryBuilder("log")
      .leftJoin("log.product", "product")
      .select([
        "product.id as product_id",
        "product.name as product_name",
        "product.sku as product_sku",
        "product.stock as current_stock",
        "log.batch_number as batch_number",
        "log.expiry_date as expiry_date",
        "log.quantity_after as quantity_in_batch"
      ])
      .where("log.expiry_date IS NOT NULL")
      .andWhere(includeExpired ? 
        "log.expiry_date <= :threshold" : 
        "log.expiry_date BETWEEN :now AND :threshold", {
        now: new Date(),
        threshold: thresholdDate
      })
      .andWhere("product.is_active = :active", { active: true })
      .orderBy("log.expiry_date", "ASC")
      .getRawMany();

    // Group by product
    const productMap = new Map();
    expiringProducts.forEach((/** @type {{ product_id: any; product_name: any; product_sku: any; current_stock: any; batch_number: any; expiry_date: string | number | Date; quantity_in_batch: any; }} */ item) => {
      const key = item.product_id;
      if (!productMap.has(key)) {
        productMap.set(key, {
          productId: item.product_id,
          productName: item.product_name,
          productSku: item.product_sku,
          currentStock: item.current_stock,
          batches: []
        });
      }
      
      productMap.get(key).batches.push({
        batchNumber: item.batch_number,
        expiryDate: item.expiry_date,
        quantity: item.quantity_in_batch,
        // @ts-ignore
        daysUntilExpiry: Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)),
        status: new Date(item.expiry_date) < new Date() ? 'expired' : 
                new Date(item.expiry_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'critical' : 'warning'
      });
    });

    const products = Array.from(productMap.values());
    
    // Calculate summary
    let expiredCount = 0;
    let criticalCount = 0;
    let warningCount = 0;
    let totalExpiringValue = 0;

    products.forEach(product => {
      product.batches.forEach((/** @type {{ status: string; }} */ batch) => {
        if (batch.status === 'expired') expiredCount++;
        if (batch.status === 'critical') criticalCount++;
        if (batch.status === 'warning') warningCount++;
        
        // Get product price for value calculation
        // This would require joining with product table for price
      });
    });

    return {
      status: true,
      message: "Expiring products retrieved successfully",
      data: {
        thresholdDays: daysAhead,
        includeExpired,
        products: products.map(product => ({
          ...product,
          totalExpiringQuantity: product.batches.reduce((/** @type {any} */ sum, /** @type {{ quantity: any; }} */ batch) => sum + batch.quantity, 0)
        })),
        summary: {
          totalProducts: products.length,
          totalBatches: expiringProducts.length,
          expired: expiredCount,
          critical: criticalCount,
          warning: warningCount,
          totalExpiringQuantity: expiringProducts.reduce((/** @type {any} */ sum, /** @type {{ quantity_in_batch: any; }} */ item) => sum + item.quantity_in_batch, 0)
        }
      }
    };
  },

  /**
   * @param {{ product: any; }} repositories
   * @param {{ byCategory?: false | undefined; bySupplier?: false | undefined; }} params
   */
  async getInventoryValue(repositories, params) {
    const { product: productRepo } = repositories;
    const { byCategory = false, bySupplier = false } = params;

    // Base query for inventory value
    const query = productRepo.createQueryBuilder("product")
      .select([
        "SUM(product.stock) as total_quantity",
        "SUM(product.stock * product.price) as total_retail_value",
        "SUM(product.stock * COALESCE(product.cost_price, product.price * 0.7)) as total_cost_value"
      ])
      .where("product.is_active = :active", { active: true })
      .andWhere("product.is_deleted = :deleted", { deleted: false });

    const totalValue = await query.getRawOne();

    let categoryBreakdown = [];
    let supplierBreakdown = [];

    if (byCategory) {
      categoryBreakdown = await productRepo.createQueryBuilder("product")
        .select([
          "product.category_name as category",
          "COUNT(*) as product_count",
          "SUM(product.stock) as total_quantity",
          "SUM(product.stock * product.price) as retail_value",
          "SUM(product.stock * COALESCE(product.cost_price, product.price * 0.7)) as cost_value"
        ])
        .where("product.is_active = :active", { active: true })
        .andWhere("product.category_name IS NOT NULL")
        .groupBy("product.category_name")
        .orderBy("retail_value", "DESC")
        .getRawMany();
    }

    if (bySupplier) {
      supplierBreakdown = await productRepo.createQueryBuilder("product")
        .select([
          "product.supplier_name as supplier",
          "COUNT(*) as product_count",
          "SUM(product.stock) as total_quantity",
          "SUM(product.stock * product.price) as retail_value",
          "SUM(product.stock * COALESCE(product.cost_price, product.price * 0.7)) as cost_value"
        ])
        .where("product.is_active = :active", { active: true })
        .andWhere("product.supplier_name IS NOT NULL")
        .groupBy("product.supplier_name")
        .orderBy("retail_value", "DESC")
        .getRawMany();
    }

    // Get top valuable products
    const topValuableProducts = await productRepo.createQueryBuilder("product")
      .select([
        "product.id",
        "product.name",
        "product.sku",
        "product.stock",
        "product.price",
        "product.cost_price",
        "product.category_name",
        "(product.stock * product.price) as retail_value",
        "(product.stock * COALESCE(product.cost_price, product.price * 0.7)) as cost_value"
      ])
      .where("product.is_active = :active", { active: true })
      .orderBy("retail_value", "DESC")
      .limit(10)
      .getRawMany();

    return {
      status: true,
      message: "Inventory value retrieved successfully",
      data: {
        summary: {
          totalQuantity: parseInt(totalValue.total_quantity),
          totalRetailValue: parseInt(totalValue.total_retail_value),
          totalCostValue: parseInt(totalValue.total_cost_value),
          totalProfitPotential: parseInt(totalValue.total_retail_value) - parseInt(totalValue.total_cost_value),
          avgProfitMargin: ((parseInt(totalValue.total_retail_value) - parseInt(totalValue.total_cost_value)) / 
                           parseInt(totalValue.total_retail_value)) * 100
        },
        categoryBreakdown: categoryBreakdown.map((/** @type {{ category: any; product_count: string; total_quantity: string; retail_value: string; cost_value: string; }} */ item) => ({
          category: item.category,
          productCount: parseInt(item.product_count),
          quantity: parseInt(item.total_quantity),
          retailValue: parseInt(item.retail_value),
          costValue: parseInt(item.cost_value),
          profitPotential: parseInt(item.retail_value) - parseInt(item.cost_value)
        })),
        supplierBreakdown: supplierBreakdown.map((/** @type {{ supplier: any; product_count: string; total_quantity: string; retail_value: string; cost_value: string; }} */ item) => ({
          supplier: item.supplier,
          productCount: parseInt(item.product_count),
          quantity: parseInt(item.total_quantity),
          retailValue: parseInt(item.retail_value),
          costValue: parseInt(item.cost_value),
          profitPotential: parseInt(item.retail_value) - parseInt(item.cost_value)
        })),
        topValuableProducts: topValuableProducts.map((/** @type {{ product_id: any; product_name: any; product_sku: any; product_stock: any; product_price: any; product_cost_price: any; product_category_name: any; retail_value: string; cost_value: string; }} */ item) => ({
          id: item.product_id,
          name: item.product_name,
          sku: item.product_sku,
          stock: item.product_stock,
          price: item.product_price,
          costPrice: item.product_cost_price,
          category: item.product_category_name,
          retailValue: parseInt(item.retail_value),
          costValue: parseInt(item.cost_value),
          profitPotential: parseInt(item.retail_value) - parseInt(item.cost_value)
        }))
      }
    };
  }
};