// priceHistory.ipc.js - Price History Handler
//@ts-check
const { ipcMain } = require("electron");
const { AppDataSource } = require("../db/dataSource");
const { logger } = require("../../utils/logger");
const { withErrorHandling } = require("../../utils/errorHandler");

class PriceHistoryHandler {
  constructor() {
    // Initialize repositories
    this.priceHistoryRepo = null;
    this.productRepo = null;
    this.userRepo = null;
  }

  async initializeRepositories() {
    if (!this.priceHistoryRepo) {
      this.priceHistoryRepo = AppDataSource.getRepository("PriceHistory");
    }
    if (!this.productRepo) {
      this.productRepo = AppDataSource.getRepository("Product");
    }
    if (!this.userRepo) {
      this.userRepo = AppDataSource.getRepository("User");
    }
  }

  /** @param {Electron.IpcMainInvokeEvent} event @param {{ method: any; params: {}; }} payload */
  async handleRequest(event, payload) {
    try {
      await this.initializeRepositories();
      
      const method = payload.method;
      const params = payload.params || {};
      // @ts-ignore
      const userId = params.userId || event.sender.id || 0;
      const enrichedParams = { ...params, _userId: userId };

      // Log the request
      if (logger) {
        // @ts-ignore
        logger.info(`PriceHistoryHandler: ${method}`, { params, userId });
      }

      // ROUTE REQUESTS
      switch (method) {
        // 📊 READ OPERATIONS
        case "getPriceHistoryByProduct":
          return await this.getPriceHistoryByProduct(
            // @ts-ignore
            enrichedParams.productId,
            // @ts-ignore
            enrichedParams.limit,
            userId
          );

        case "getPriceHistoryByDateRange":
          return await this.getPriceHistoryByDateRange(
            // @ts-ignore
            enrichedParams.startDate,
            // @ts-ignore
            enrichedParams.endDate,
            // @ts-ignore
            enrichedParams.productId,
            userId
          );

        case "getRecentPriceChanges":
          return await this.getRecentPriceChanges(
            // @ts-ignore
            enrichedParams.limit,
            userId
          );

        case "getPriceChangesByType":
          return await this.getPriceChangesByType(
            // @ts-ignore
            enrichedParams.changeType,
            // @ts-ignore
            enrichedParams.limit,
            userId
          );

        case "getPriceStatistics":
          return await this.getPriceStatistics(
            // @ts-ignore
            enrichedParams.productId,
            userId
          );

        // ✏️ WRITE OPERATIONS (with transactions)
        case "logPriceChange":
          return await this.handleWithTransaction(
            this.logPriceChange.bind(this),
            enrichedParams
          );

        case "bulkUpdatePrices":
          return await this.handleWithTransaction(
            this.bulkUpdatePrices.bind(this),
            enrichedParams
          );

        case "revertPriceChange":
          return await this.handleWithTransaction(
            this.revertPriceChange.bind(this),
            enrichedParams
          );

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("PriceHistoryHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("PriceHistoryHandler error:", error);
      }
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Internal server error",
        data: null,
      };
    }
  }

  /**
   * Get price history for a specific product
   * @param {number} productId 
   * @param {number} limit 
   * @param {number} userId 
   */
  // @ts-ignore
  async getPriceHistoryByProduct(productId, limit = 50, userId) {
    try {
      if (!productId) {
        return { status: false, message: "Product ID is required", data: null };
      }

      // @ts-ignore
      const queryBuilder = this.priceHistoryRepo
        .createQueryBuilder("ph")
        .leftJoinAndSelect("ph.product", "product")
        .leftJoinAndSelect("ph.changed_by", "user")
        .where("ph.product_id = :productId", { productId })
        .orderBy("ph.effective_date", "DESC")
        .addOrderBy("ph.created_at", "DESC");

      if (limit) {
        queryBuilder.limit(limit);
      }

      const priceHistory = await queryBuilder.getMany();

      return {
        status: true,
        message: "Price history retrieved successfully",
        data: priceHistory,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get price changes within a date range
   * @param {string} startDate 
   * @param {string} endDate 
   * @param {number} productId 
   * @param {number} userId 
   */
  // @ts-ignore
  async getPriceHistoryByDateRange(startDate, endDate, productId = null, userId) {
    try {
      // @ts-ignore
      const queryBuilder = this.priceHistoryRepo
        .createQueryBuilder("ph")
        .leftJoinAndSelect("ph.product", "product")
        .leftJoinAndSelect("ph.changed_by", "user")
        .where("ph.effective_date BETWEEN :startDate AND :endDate", {
          startDate,
          endDate,
        })
        .orderBy("ph.effective_date", "DESC");

      if (productId) {
        queryBuilder.andWhere("ph.product_id = :productId", { productId });
      }

      const priceHistory = await queryBuilder.getMany();

      return {
        status: true,
        message: "Price history by date range retrieved successfully",
        data: priceHistory,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get most recent price changes
   * @param {number} limit 
   * @param {number} userId 
   */
  // @ts-ignore
  async getRecentPriceChanges(limit = 20, userId) {
    try {
      // @ts-ignore
      const priceHistory = await this.priceHistoryRepo
        .createQueryBuilder("ph")
        .leftJoinAndSelect("ph.product", "product")
        .leftJoinAndSelect("ph.changed_by", "user")
        .orderBy("ph.effective_date", "DESC")
        .addOrderBy("ph.created_at", "DESC")
        .limit(limit)
        .getMany();

      return {
        status: true,
        message: "Recent price changes retrieved successfully",
        data: priceHistory,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get price changes by type (manual, discount, promotion, etc.)
   * @param {string} changeType 
   * @param {number} limit 
   * @param {number} userId 
   */
  // @ts-ignore
  async getPriceChangesByType(changeType, limit = 50, userId) {
    try {
      if (!changeType) {
        return { status: false, message: "Change type is required", data: null };
      }

      // @ts-ignore
      const priceHistory = await this.priceHistoryRepo
        .createQueryBuilder("ph")
        .leftJoinAndSelect("ph.product", "product")
        .leftJoinAndSelect("ph.changed_by", "user")
        .where("ph.change_type = :changeType", { changeType })
        .orderBy("ph.effective_date", "DESC")
        .limit(limit)
        .getMany();

      return {
        status: true,
        message: `Price changes by type '${changeType}' retrieved successfully`,
        data: priceHistory,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get price statistics for a product
   * @param {number} productId 
   * @param {number} userId 
   */
  // @ts-ignore
  async getPriceStatistics(productId, userId) {
    try {
      if (!productId) {
        return { status: false, message: "Product ID is required", data: null };
      }

      // @ts-ignore
      const stats = await this.priceHistoryRepo
        .createQueryBuilder("ph")
        .select([
          "COUNT(ph.id) as total_changes",
          "MIN(ph.old_price) as min_price",
          "MAX(ph.new_price) as max_price",
          "AVG(ph.old_price) as avg_old_price",
          "AVG(ph.new_price) as avg_new_price",
        ])
        .where("ph.product_id = :productId", { productId })
        .getRawOne();

      // Get latest price change
      // @ts-ignore
      const latestChange = await this.priceHistoryRepo
        .createQueryBuilder("ph")
        .where("ph.product_id = :productId", { productId })
        .orderBy("ph.effective_date", "DESC")
        .limit(1)
        .getOne();

      return {
        status: true,
        message: "Price statistics retrieved successfully",
        data: {
          ...stats,
          latest_change: latestChange,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Log a price change (main method)
   * @param {object} params 
   * @param {import("typeorm").QueryRunner} queryRunner 
   */
  async logPriceChange(params, queryRunner) {
    const {
      // @ts-ignore
      productId,
      // @ts-ignore
      oldPrice,
      // @ts-ignore
      newPrice,
      // @ts-ignore
      changeType = "manual",
      // @ts-ignore
      changeReason = null,
      // @ts-ignore
      referenceId = null,
      // @ts-ignore
      referenceType = null,
      // @ts-ignore
      changedById = null,
      // @ts-ignore
      userId,
    } = params;

    try {
      // Validate required fields
      if (!productId || oldPrice === undefined || newPrice === undefined) {
        return {
          status: false,
          message: "productId, oldPrice, and newPrice are required",
          data: null,
        };
      }

      // Get repositories with query runner
      const priceHistoryRepo = queryRunner.manager.getRepository("PriceHistory");
      const productRepo = queryRunner.manager.getRepository("Product");

      // Check if product exists
      const product = await productRepo.findOne({
        where: { id: productId },
      });

      if (!product) {
        return {
          status: false,
          message: "Product not found",
          data: null,
        };
      }

      // Create price history record
      const priceHistory = priceHistoryRepo.create({
        product_id: productId,
        old_price: oldPrice,
        new_price: newPrice,
        change_type: changeType,
        change_reason: changeReason,
        changed_by_id: changedById || userId,
        reference_id: referenceId,
        reference_type: referenceType,
        effective_date: new Date(),
      });

      await priceHistoryRepo.save(priceHistory);

      // Update product's last price change timestamp
      await productRepo.update(productId, {
        last_price_change: new Date(),
        price: newPrice, // Update current price in product table
      });

      // Log activity
      await this.logActivity(
        userId,
        "PRICE_CHANGE",
        `Changed price for product ${productId} from ${oldPrice} to ${newPrice} (${changeType})`,
        queryRunner
      );

      return {
        status: true,
        message: "Price change logged successfully",
        data: priceHistory,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Bulk update prices for multiple products
   * @param {object} params 
   * @param {import("typeorm").QueryRunner} queryRunner 
   */
  async bulkUpdatePrices(params, queryRunner) {
    // @ts-ignore
    const { priceUpdates, changeType = "bulk", changeReason = "Bulk price update", userId } = params;

    try {
      if (!Array.isArray(priceUpdates) || priceUpdates.length === 0) {
        return {
          status: false,
          message: "priceUpdates array is required and cannot be empty",
          data: null,
        };
      }

      const priceHistoryRepo = queryRunner.manager.getRepository("PriceHistory");
      const productRepo = queryRunner.manager.getRepository("Product");

      const results = [];
      const errors = [];

      for (const update of priceUpdates) {
        try {
          const { productId, newPrice, oldPrice } = update;

          // Get current price if oldPrice not provided
          let currentPrice = oldPrice;
          if (currentPrice === undefined) {
            const product = await productRepo.findOne({
              where: { id: productId },
              select: ["price"],
            });
            currentPrice = product?.price || 0;
          }

          // Create price history record
          const priceHistory = priceHistoryRepo.create({
            product_id: productId,
            old_price: currentPrice,
            new_price: newPrice,
            change_type: changeType,
            change_reason: changeReason,
            changed_by_id: userId,
            effective_date: new Date(),
          });

          await priceHistoryRepo.save(priceHistory);

          // Update product price
          await productRepo.update(productId, {
            price: newPrice,
            last_price_change: new Date(),
          });

          results.push({
            productId,
            success: true,
            oldPrice: currentPrice,
            newPrice,
          });
        } catch (error) {
          errors.push({
            productId: update.productId,
            // @ts-ignore
            error: error.message,
          });
        }
      }

      // Log activity
      await this.logActivity(
        userId,
        "BULK_PRICE_UPDATE",
        `Updated prices for ${results.length} products. ${errors.length} errors.`,
        queryRunner
      );

      return {
        status: true,
        message: `Bulk update completed. ${results.length} successful, ${errors.length} failed.`,
        data: { results, errors },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Revert to a previous price
   * @param {object} params 
   * @param {import("typeorm").QueryRunner} queryRunner 
   */
  async revertPriceChange(params, queryRunner) {
    // @ts-ignore
    const { priceHistoryId, reason = "Reverted to previous price", userId } = params;

    try {
      if (!priceHistoryId) {
        return {
          status: false,
          message: "priceHistoryId is required",
          data: null,
        };
      }

      const priceHistoryRepo = queryRunner.manager.getRepository("PriceHistory");
      const productRepo = queryRunner.manager.getRepository("Product");

      // Get the price history record to revert to
      const originalChange = await priceHistoryRepo.findOne({
        where: { id: priceHistoryId },
        relations: ["product"],
      });

      if (!originalChange) {
        return {
          status: false,
          message: "Price history record not found",
          data: null,
        };
      }

      const productId = originalChange.product_id;
      const currentProduct = await productRepo.findOne({
        where: { id: productId },
      });

      if (!currentProduct) {
        return {
          status: false,
          message: "Product not found",
          data: null,
        };
      }

      // Create new price history record for the revert
      const revertRecord = priceHistoryRepo.create({
        product_id: productId,
        old_price: currentProduct.price,
        new_price: originalChange.old_price,
        change_type: "revert",
        change_reason: reason,
        changed_by_id: userId,
        reference_id: priceHistoryId.toString(),
        reference_type: "price_revert",
        effective_date: new Date(),
      });

      await priceHistoryRepo.save(revertRecord);

      // Update product price to the old price
      await productRepo.update(productId, {
        price: originalChange.old_price,
        last_price_change: new Date(),
      });

      // Log activity
      await this.logActivity(
        userId,
        "PRICE_REVERT",
        `Reverted price for product ${productId} from ${currentProduct.price} to ${originalChange.old_price}`,
        queryRunner
      );

      return {
        status: true,
        message: "Price reverted successfully",
        data: revertRecord,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Wrap critical operations in a database transaction
   * @param {(arg0: any, arg1: import("typeorm").QueryRunner) => any} handler
   * @param {{ _userId: any; }} params
   */
  async handleWithTransaction(handler, params) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await handler(params, queryRunner);

      if (result.status) {
        await queryRunner.commitTransaction();
      } else {
        await queryRunner.rollbackTransaction();
      }

      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Log user activity
   * @param {any} userId
   * @param {any} action
   * @param {any} description
   * @param {import("typeorm").QueryRunner} queryRunner
   */
  // @ts-ignore
  async logActivity(userId, action, description, queryRunner = null) {
    try {
      // Note: You need to have a UserActivity entity and repository
      // This is a placeholder - adjust based on your actual UserActivity implementation
      if (logger) {
        // @ts-ignore
        logger.info("User Activity", {
          userId,
          action,
          description,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.warn("Failed to log activity:", error);
      if (logger) {
        // @ts-ignore
        logger.warn("Failed to log activity:", error);
      }
    }
  }
}

// Register IPC handler
const priceHistoryHandler = new PriceHistoryHandler();

ipcMain.handle(
  "price-history",
  withErrorHandling(
    // @ts-ignore
    priceHistoryHandler.handleRequest.bind(priceHistoryHandler),
    "IPC:priceHistory"
  )
);

module.exports = { PriceHistoryHandler, priceHistoryHandler };