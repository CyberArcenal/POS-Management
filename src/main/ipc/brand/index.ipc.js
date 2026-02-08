// src/ipc/brand/brand.ipc.js - Streamlined Brand Handler
// @ts-check
const { ipcMain } = require("electron");
const { withErrorHandling } = require("../../../utils/errorHandler");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/dataSource");
const Brand = require("../../../entities/Brand");

class BrandHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // ✅ CRUD OPERATIONS
    this.createBrand = this.createBrand.bind(this);
    this.updateBrand = this.updateBrand.bind(this);
    this.deleteBrand = this.deleteBrand.bind(this);
    this.getBrandById = this.getBrandById.bind(this);

    // ✅ READ-ONLY HANDLERS
    this.getAllBrands = this.getAllBrands.bind(this);
    this.searchBrands = this.searchBrands.bind(this);
    this.getActiveBrands = this.getActiveBrands.bind(this);
  }

  /**
   * Create a new brand
   * @param {{ brandData: object, _userId: number }} params
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  // @ts-ignore
  async createBrand(params, queryRunner = null) {
    const { brandData, _userId } = params;

    try {
      const brandRepo = queryRunner
        ? queryRunner.manager.getRepository(Brand)
        : AppDataSource.getRepository(Brand);

      // Validate required fields
      // @ts-ignore
      if (!brandData.name) {
        return {
          status: false,
          message: "Brand name is required",
          data: null,
        };
      }

      // Check if brand name already exists
      const existingBrand = await brandRepo.findOne({
        where: {
          // @ts-ignore
          name: brandData.name,
          is_active: true,
        },
      });

      if (existingBrand) {
        return {
          status: false,
          // @ts-ignore
          message: `Brand with name "${brandData.name}" already exists`,
          data: null,
        };
      }

      // Create new brand
      const brand = brandRepo.create({
        ...brandData,
        is_active: true,
      });

      const savedBrand = await brandRepo.save(brand);

      // Log activity
      if (_userId) {
        const activityRepo = queryRunner
          ? queryRunner.manager.getRepository(
              require("../../../entities/UserActivity"),
            )
          : AppDataSource.getRepository(
              require("../../../entities/UserActivity"),
            );

        await activityRepo.save({
          user_id: _userId,
          action: "brand_create",
          entity: "Brand",
          entity_id: savedBrand.id,
          description: `Created brand: ${savedBrand.name}`,
        });
      }

      return {
        status: true,
        message: "Brand created successfully",
        data: savedBrand,
      };
    } catch (error) {
      console.error("Create brand error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to create brand",
        data: null,
      };
    }
  }

  /**
   * Update existing brand
   * @param {{ brandId: number, brandData: object, _userId: number }} params
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  // @ts-ignore
  async updateBrand(params, queryRunner = null) {
    const { brandId, brandData, _userId } = params;

    try {
      const brandRepo = queryRunner
        ? queryRunner.manager.getRepository(Brand)
        : AppDataSource.getRepository(Brand);

      // Find brand
      const brand = await brandRepo.findOne({
        where: { id: brandId, is_active: true },
      });

      if (!brand) {
        return {
          status: false,
          message: `Brand with ID ${brandId} not found`,
          data: null,
        };
      }

      // Check if new name conflicts with another brand
      // @ts-ignore
      if (brandData.name && brandData.name !== brand.name) {
        const existingBrand = await brandRepo.findOne({
          where: {
            // @ts-ignore
            name: brandData.name,
            is_active: true,
            id: { $not: brandId }, // Exclude current brand
          },
        });

        if (existingBrand) {
          return {
            status: false,
            // @ts-ignore
            message: `Brand with name "${brandData.name}" already exists`,
            data: null,
          };
        }
      }

      // Update brand
      Object.assign(brand, brandData);
      brand.updated_at = new Date();

      const updatedBrand = await brandRepo.save(brand);

      // Log activity
      if (_userId) {
        const activityRepo = queryRunner
          ? queryRunner.manager.getRepository(
              require("../../../entities/UserActivity"),
            )
          : AppDataSource.getRepository(
              require("../../../entities/UserActivity"),
            );

        await activityRepo.save({
          user_id: _userId,
          action: "brand_update",
          entity: "Brand",
          entity_id: updatedBrand.id,
          description: `Updated brand: ${updatedBrand.name}`,
        });
      }

      return {
        status: true,
        message: "Brand updated successfully",
        data: updatedBrand,
      };
    } catch (error) {
      console.error("Update brand error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to update brand",
        data: null,
      };
    }
  }

  /**
   * Soft delete brand (set is_active to false)
   * @param {{ brandId: number, _userId: number }} params
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  // @ts-ignore
  async deleteBrand(params, queryRunner = null) {
    const { brandId, _userId } = params;

    try {
      const brandRepo = queryRunner
        ? queryRunner.manager.getRepository(Brand)
        : AppDataSource.getRepository(Brand);

      // Find brand
      const brand = await brandRepo.findOne({
        where: { id: brandId, is_active: true },
      });

      if (!brand) {
        return {
          status: false,
          message: `Brand with ID ${brandId} not found`,
          data: null,
        };
      }

      // Check if brand has associated products
      const productRepo = queryRunner
        ? queryRunner.manager.getRepository(
            // @ts-ignore
            require("../../../entities/Product"),
          )
        // @ts-ignore
        : AppDataSource.getRepository(require("../../../entities/Product"));

      const productCount = await productRepo.count({
        where: {
          brand_id: brandId,
          is_deleted: false,
        },
      });

      if (productCount > 0) {
        return {
          status: false,
          message: `Cannot delete brand. ${productCount} product(s) are associated with this brand.`,
          data: null,
        };
      }

      // Soft delete
      brand.is_active = false;
      brand.updated_at = new Date();

      await brandRepo.save(brand);

      // Log activity
      if (_userId) {
        const activityRepo = queryRunner
          ? queryRunner.manager.getRepository(
              require("../../../entities/UserActivity"),
            )
          : AppDataSource.getRepository(
              require("../../../entities/UserActivity"),
            );

        await activityRepo.save({
          user_id: _userId,
          action: "brand_delete",
          entity: "Brand",
          entity_id: brand.id,
          description: `Deleted brand: ${brand.name}`,
        });
      }

      return {
        status: true,
        message: "Brand deleted successfully",
        data: { id: brandId },
      };
    } catch (error) {
      console.error("Delete brand error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to delete brand",
        data: null,
      };
    }
  }

  /**
   * Get brand by ID
   * @param {{ brandId: number, _userId: number }} params
   */
  async getBrandById(params) {
    // @ts-ignore
    const { brandId, _userId } = params;

    try {
      const brandRepo = AppDataSource.getRepository(Brand);

      const brand = await brandRepo.findOne({
        where: { id: brandId, is_active: true },
        relations: ["products"],
      });

      if (!brand) {
        return {
          status: false,
          message: `Brand with ID ${brandId} not found`,
          data: null,
        };
      }

      return {
        status: true,
        message: "Brand retrieved successfully",
        data: brand,
      };
    } catch (error) {
      console.error("Get brand by ID error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to retrieve brand",
        data: null,
      };
    }
  }

  /**
   * Get all brands with pagination
   * @param {{
   *   page?: number,
   *   limit?: number,
   *   sortBy?: string,
   *   sortOrder?: 'ASC' | 'DESC',
   *   _userId: number
   * }} params
   */
  async getAllBrands(params) {
    const {
      page = 1,
      limit = 20,
      sortBy = "created_at",
      sortOrder = "DESC",
      // @ts-ignore
      _userId,
    } = params;

    try {
      const brandRepo = AppDataSource.getRepository(Brand);
      const skip = (page - 1) * limit;

      // Build query
      const queryBuilder = brandRepo
        .createQueryBuilder("brand")
        .where("brand.is_active = :isActive", { isActive: true });

      // Count total
      const total = await queryBuilder.getCount();

      // Apply sorting and pagination
      const brands = await queryBuilder
        .orderBy(`brand.${sortBy}`, sortOrder)
        .skip(skip)
        .take(limit)
        .getMany();

      return {
        status: true,
        message: "Brands retrieved successfully",
        data: {
          brands,
          pagination: {
            // @ts-ignore
            page: parseInt(page),
            // @ts-ignore
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      console.error("Get all brands error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to retrieve brands",
        data: null,
      };
    }
  }

  /**
   * Search brands by name
   * @param {{ query: string, _userId: number }} params
   */
  async searchBrands(params) {
    // @ts-ignore
    const { query, _userId } = params;

    try {
      if (!query || query.trim().length < 2) {
        return {
          status: false,
          message: "Search query must be at least 2 characters",
          data: [],
        };
      }

      const brandRepo = AppDataSource.getRepository(Brand);

      const brands = await brandRepo
        .createQueryBuilder("brand")
        .where("brand.is_active = :isActive", { isActive: true })
        .andWhere("(brand.name LIKE :query OR brand.description LIKE :query)", {
          query: `%${query}%`,
        })
        .orderBy("brand.name", "ASC")
        .limit(50)
        .getMany();

      return {
        status: true,
        message: "Brands search completed",
        data: brands,
      };
    } catch (error) {
      console.error("Search brands error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to search brands",
        data: null,
      };
    }
  }

  /**
   * Get active brands for dropdowns
   * @param {{ _userId: number }} params
   */
  async getActiveBrands(params) {
    // @ts-ignore
    const { _userId } = params;

    try {
      const brandRepo = AppDataSource.getRepository(Brand);

      const brands = await brandRepo
        .createQueryBuilder("brand")
        .select(["brand.id", "brand.name"])
        .where("brand.is_active = :isActive", { isActive: true })
        .orderBy("brand.name", "ASC")
        .getMany();

      return {
        status: true,
        message: "Active brands retrieved successfully",
        data: brands,
      };
    } catch (error) {
      console.error("Get active brands error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to retrieve active brands",
        data: null,
      };
    }
  }

  /**
   * Main request handler
   * @param {Electron.IpcMainInvokeEvent} event
   * @param {{ method: string; params: any; }} payload
   */
  async handleRequest(event, payload) {
    try {
      const method = payload.method;
      const params = payload.params || {};
      const userId = params.userId || event.sender.id || 0;
      const enrichedParams = { ...params, _userId: userId };

      if (logger) {
        // @ts-ignore
        logger.info(`BrandHandler: ${method}`, {
          method,
          userId,
          hasParams: !!Object.keys(params).length,
        });
      }

      // Route to appropriate method
      switch (method) {
        // 📦 CRUD OPERATIONS
        case "createBrand":
          return await this.handleWithTransaction(
            this.createBrand,
            enrichedParams,
          );

        case "updateBrand":
          return await this.handleWithTransaction(
            this.updateBrand,
            enrichedParams,
          );

        case "deleteBrand":
          return await this.handleWithTransaction(
            this.deleteBrand,
            enrichedParams,
          );

        case "getBrandById":
          return await this.getBrandById(enrichedParams);

        // 🔍 READ-ONLY OPERATIONS
        case "getAllBrands":
          return await this.getAllBrands(enrichedParams);

        case "searchBrands":
          return await this.searchBrands(enrichedParams);

        case "getActiveBrands":
          return await this.getActiveBrands(enrichedParams);

        default:
          return {
            status: false,
            message: `Method '${method}' not available in BrandHandler`,
            data: null,
          };
      }
    } catch (error) {
      console.error("BrandHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("BrandHandler error:", error);
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
   * Wrap critical operations in a database transaction
   * @param {(params: any, queryRunner?: import("typeorm").QueryRunner) => Promise<any>} handler
   * @param {{ _userId: number; }} params
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
}

// Register IPC handler
const brandHandler = new BrandHandler();

ipcMain.handle(
  "brand",
  // @ts-ignore
  withErrorHandling(brandHandler.handleRequest.bind(brandHandler), "IPC:brand"),
);

module.exports = { BrandHandler, brandHandler };
