// src/ipc/supplier/supplier.ipc.js - Complete Supplier Handler
// @ts-check
const { ipcMain } = require("electron");
const { withErrorHandling } = require("../../../utils/errorHandler");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/dataSource");
const Supplier = require("../../../entities/Supplier");
const { Product } = require("../../../entities/Product");

class SupplierHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // ✅ CRUD OPERATIONS
    this.createSupplier = this.createSupplier.bind(this);
    this.updateSupplier = this.updateSupplier.bind(this);
    this.deleteSupplier = this.deleteSupplier.bind(this);
    this.getSupplierById = this.getSupplierById.bind(this);

    // ✅ BULK & IMPORT OPERATIONS
    this.bulkUpdateSuppliers = this.bulkUpdateSuppliers.bind(this);
    this.importSuppliers = this.importSuppliers.bind(this);

    // ✅ READ-ONLY HANDLERS
    this.getAllSuppliers = this.getAllSuppliers.bind(this);
    this.searchSuppliers = this.searchSuppliers.bind(this);
    this.getActiveSuppliers = this.getActiveSuppliers.bind(this);
    this.getSuppliersWithProductCount =
      this.getSuppliersWithProductCount.bind(this);
    this.getSupplierProducts = this.getSupplierProducts.bind(this);
    this.getSupplierPerformance = this.getSupplierPerformance.bind(this);
  }

  /**
   * @param {string} supplierName
   * @param {import("typeorm").Repository<import("typeorm").ObjectLiteral>} supplierRepo
   */
  async generateSupplierCode(supplierName, supplierRepo) {
    try {
      // Create base code from name
      const baseCode = supplierName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .substring(0, 6);

      let code = baseCode;
      let counter = 1;

      // Check if code exists
      while (true) {
        const existing = await supplierRepo.findOne({
          where: { code: code },
        });

        if (!existing) break;

        code = `${baseCode}${counter.toString().padStart(2, "0")}`;
        counter++;

        if (counter > 99) {
          // Fallback to timestamp
          code = `SUP${Date.now().toString().slice(-6)}`;
          break;
        }
      }

      return code;
    } catch (error) {
      console.error("Generate supplier code error:", error);
      // Fallback code
      return `SUP${Date.now().toString().slice(-6)}`;
    }
  }

  /**
   * Create a new supplier
   * @param {{ supplierData: object, _userId: number }} params
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  // @ts-ignore
  async createSupplier(params, queryRunner = null) {
    const { supplierData, _userId } = params;

    try {
      const supplierRepo = queryRunner
        ? queryRunner.manager.getRepository(Supplier)
        : AppDataSource.getRepository(Supplier);

      // Validate required fields
      // @ts-ignore
      if (!supplierData.name) {
        return {
          status: false,
          message: "Supplier name is required",
          data: null,
        };
      }

      // Check if supplier name already exists
      const existingSupplier = await supplierRepo.findOne({
        where: {
          // @ts-ignore
          name: supplierData.name,
          is_active: true,
        },
      });

      if (existingSupplier) {
        return {
          status: false,
          // @ts-ignore
          message: `Supplier with name "${supplierData.name}" already exists`,
          data: null,
        };
      }

      // Generate supplier code if not provided
      // @ts-ignore
      if (!supplierData.code) {
        // @ts-ignore
        supplierData.code = await this.generateSupplierCode(
          // @ts-ignore
          supplierData.name,
          supplierRepo,
        );
      } else {
        // Check if code already exists
        const existingByCode = await supplierRepo.findOne({
          // @ts-ignore
          where: { code: supplierData.code },
        });

        if (existingByCode) {
          return {
            status: false,
            // @ts-ignore
            message: `Supplier with code "${supplierData.code}" already exists`,
            data: null,
          };
        }
      }

      // Check email uniqueness if provided
      // @ts-ignore
      if (supplierData.email) {
        const existingByEmail = await supplierRepo.findOne({
          where: {
            // @ts-ignore
            email: supplierData.email,
            is_active: true,
          },
        });

        if (existingByEmail) {
          return {
            status: false,
            // @ts-ignore
            message: `Supplier with email "${supplierData.email}" already exists`,
            data: null,
          };
        }
      }

      // Create new supplier
      const supplier = supplierRepo.create({
        ...supplierData,
        // @ts-ignore
        code: supplierData.code.toUpperCase(),
        is_active: true,
      });

      const savedSupplier = await supplierRepo.save(supplier);

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
          action: "supplier_create",
          entity: "Supplier",
          entity_id: savedSupplier.id,
          description: `Created supplier: ${savedSupplier.name} (Code: ${savedSupplier.code})`,
        });
      }

      return {
        status: true,
        message: "Supplier created successfully",
        data: savedSupplier,
      };
    } catch (error) {
      console.error("Create supplier error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to create supplier",
        data: null,
      };
    }
  }

  /**
   * Update existing supplier
   * @param {{ supplierId: number, supplierData: object, _userId: number }} params
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  // @ts-ignore
  async updateSupplier(params, queryRunner = null) {
    const { supplierId, supplierData, _userId } = params;

    try {
      const supplierRepo = queryRunner
        ? queryRunner.manager.getRepository(Supplier)
        : AppDataSource.getRepository(Supplier);

      // Find supplier
      const supplier = await supplierRepo.findOne({
        where: { id: supplierId, is_active: true },
      });

      if (!supplier) {
        return {
          status: false,
          message: `Supplier with ID ${supplierId} not found`,
          data: null,
        };
      }

      // Check if name is being changed and conflicts with another supplier
      // @ts-ignore
      if (supplierData.name && supplierData.name !== supplier.name) {
        const existingSupplier = await supplierRepo.findOne({
          where: {
            // @ts-ignore
            name: supplierData.name,
            is_active: true,
            id: { $not: supplierId },
          },
        });

        if (existingSupplier) {
          return {
            status: false,
            // @ts-ignore
            message: `Supplier with name "${supplierData.name}" already exists`,
            data: null,
          };
        }
      }

      // Check if code is being changed and conflicts
      // @ts-ignore
      if (supplierData.code && supplierData.code !== supplier.code) {
        const existingByCode = await supplierRepo.findOne({
          where: {
            // @ts-ignore
            code: supplierData.code.toUpperCase(),
            id: { $not: supplierId },
          },
        });

        if (existingByCode) {
          return {
            status: false,
            // @ts-ignore
            message: `Supplier with code "${supplierData.code}" already exists`,
            data: null,
          };
        }
        // @ts-ignore
        supplierData.code = supplierData.code.toUpperCase();
      }

      // Check if email is being changed and conflicts
      // @ts-ignore
      if (supplierData.email && supplierData.email !== supplier.email) {
        const existingByEmail = await supplierRepo.findOne({
          where: {
            // @ts-ignore
            email: supplierData.email,
            is_active: true,
            id: { $not: supplierId },
          },
        });

        if (existingByEmail) {
          return {
            status: false,
            // @ts-ignore
            message: `Supplier with email "${supplierData.email}" already exists`,
            data: null,
          };
        }
      }

      // Update supplier
      Object.assign(supplier, supplierData);
      supplier.updated_at = new Date();

      const updatedSupplier = await supplierRepo.save(supplier);

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
          action: "supplier_update",
          entity: "Supplier",
          entity_id: updatedSupplier.id,
          description: `Updated supplier: ${updatedSupplier.name}`,
        });
      }

      return {
        status: true,
        message: "Supplier updated successfully",
        data: updatedSupplier,
      };
    } catch (error) {
      console.error("Update supplier error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to update supplier",
        data: null,
      };
    }
  }

  /**
   * Delete supplier (soft delete)
   * @param {{ supplierId: number, _userId: number }} params
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  // @ts-ignore
  async deleteSupplier(params, queryRunner = null) {
    const { supplierId, _userId } = params;

    try {
      const supplierRepo = queryRunner
        ? queryRunner.manager.getRepository(Supplier)
        : AppDataSource.getRepository(Supplier);

      // Find supplier
      const supplier = await supplierRepo.findOne({
        where: { id: supplierId, is_active: true },
      });

      if (!supplier) {
        return {
          status: false,
          message: `Supplier with ID ${supplierId} not found`,
          data: null,
        };
      }

      // Check if supplier has associated products
      const productRepo = queryRunner
        ? queryRunner.manager.getRepository(Product)
        : AppDataSource.getRepository(Product);

      const productCount = await productRepo.count({
        where: {
          supplier_id: supplierId,
          is_deleted: false,
        },
      });

      if (productCount > 0) {
        return {
          status: false,
          message: `Cannot delete supplier. ${productCount} product(s) are associated with this supplier.`,
          data: { productCount },
        };
      }

      // Soft delete supplier
      supplier.is_active = false;
      supplier.updated_at = new Date();

      await supplierRepo.save(supplier);

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
          action: "supplier_delete",
          entity: "Supplier",
          entity_id: supplierId,
          description: `Deleted supplier: ${supplier.name} (Code: ${supplier.code})`,
        });
      }

      return {
        status: true,
        message: "Supplier deleted successfully",
        data: { id: supplierId },
      };
    } catch (error) {
      console.error("Delete supplier error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to delete supplier",
        data: null,
      };
    }
  }

  /**
   * Get supplier by ID with details
   * @param {{ supplierId: number, includeProducts: boolean, _userId: number }} params
   */
  async getSupplierById(params) {
    // @ts-ignore
    const { supplierId, includeProducts = false, _userId } = params;

    try {
      const supplierRepo = AppDataSource.getRepository(Supplier);

      // Build query
      const queryBuilder = supplierRepo
        .createQueryBuilder("supplier")
        .where("supplier.id = :supplierId", { supplierId })
        .andWhere("supplier.is_active = :isActive", { isActive: true });

      // Include products if requested
      if (includeProducts) {
        queryBuilder
          .leftJoinAndSelect("supplier.products", "products")
          .andWhere("products.is_deleted = :notDeleted", { notDeleted: false })
          .addOrderBy("products.name", "ASC");
      }

      const supplier = await queryBuilder.getOne();

      if (!supplier) {
        return {
          status: false,
          message: `Supplier with ID ${supplierId} not found`,
          data: null,
        };
      }

      // Get additional statistics
      if (includeProducts) {
        const productRepo = AppDataSource.getRepository(Product);

        // Get product counts and statistics
        const productStats = await productRepo
          .createQueryBuilder("product")
          .select([
            "COUNT(product.id) as total_products",
            "SUM(product.stock) as total_stock",
            "AVG(product.cost_price) as avg_cost_price",
          ])
          .where("product.supplier_id = :supplierId", { supplierId })
          .andWhere("product.is_deleted = :notDeleted", { notDeleted: false })
          .getRawOne();

        // @ts-ignore
        supplier.stats = {
          totalProducts: parseInt(productStats.total_products) || 0,
          totalStock: parseInt(productStats.total_stock) || 0,
          avgCostPrice: parseFloat(productStats.avg_cost_price) || 0,
        };
      }

      return {
        status: true,
        message: "Supplier retrieved successfully",
        data: supplier,
      };
    } catch (error) {
      console.error("Get supplier by ID error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to retrieve supplier",
        data: null,
      };
    }
  }

  /**
   * Bulk update suppliers
   * @param {{ updates: Array<{id: number, data: object}>, _userId: number }} params
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  // @ts-ignore
  async bulkUpdateSuppliers(params, queryRunner = null) {
    const { updates, _userId } = params;

    try {
      if (!updates || !Array.isArray(updates) || updates.length === 0) {
        return {
          status: false,
          message: "Updates array is required and cannot be empty",
          data: null,
        };
      }

      const supplierRepo = queryRunner
        ? queryRunner.manager.getRepository(Supplier)
        : AppDataSource.getRepository(Supplier);

      const updatedSuppliers = [];
      const errors = [];

      // Process each update
      for (let i = 0; i < updates.length; i++) {
        const { id, data } = updates[i];

        try {
          // Find supplier
          const supplier = await supplierRepo.findOne({
            where: { id: id, is_active: true },
          });

          if (!supplier) {
            errors.push(`Supplier ${i + 1}: Supplier with ID ${id} not found`);
            continue;
          }

          // Check for duplicate names
          // @ts-ignore
          if (data.name && data.name !== supplier.name) {
            const existingSupplier = await supplierRepo.findOne({
              where: {
                // @ts-ignore
                name: data.name,
                is_active: true,
                id: { $not: id },
              },
            });

            if (existingSupplier) {
              errors.push(
                // @ts-ignore
                `Supplier ${i + 1}: Name "${data.name}" already exists`,
              );
              continue;
            }
          }

          // Update supplier
          Object.assign(supplier, data);
          supplier.updated_at = new Date();

          const updatedSupplier = await supplierRepo.save(supplier);
          updatedSuppliers.push(updatedSupplier);
        } catch (error) {
          // @ts-ignore
          errors.push(`Supplier ${i + 1}: ${error.message}`);
        }
      }

      // Log activity
      if (_userId && updatedSuppliers.length > 0) {
        const activityRepo = queryRunner
          ? queryRunner.manager.getRepository(
              require("../../../entities/UserActivity"),
            )
          : AppDataSource.getRepository(
              require("../../../entities/UserActivity"),
            );

        await activityRepo.save({
          user_id: _userId,
          action: "supplier_bulk_update",
          entity: "Supplier",
          entity_id: null,
          description: `Bulk updated ${updatedSuppliers.length} supplier(s)`,
        });
      }

      return {
        status: errors.length === 0 || updatedSuppliers.length > 0,
        message:
          errors.length > 0
            ? `Updated ${updatedSuppliers.length} suppliers with ${errors.length} errors`
            : `Successfully updated ${updatedSuppliers.length} suppliers`,
        data: {
          updated: updatedSuppliers,
          errors: errors,
          totalProcessed: updates.length,
          successCount: updatedSuppliers.length,
          errorCount: errors.length,
        },
      };
    } catch (error) {
      console.error("Bulk update suppliers error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to bulk update suppliers",
        data: null,
      };
    }
  }


  // @ts-ignore
  async importSuppliers(params, queryRunner = null) {
    const { suppliers, overwrite = false, _userId } = params;

    try {
      if (!suppliers || !Array.isArray(suppliers) || suppliers.length === 0) {
        return {
          status: false,
          message: "Suppliers array is required and cannot be empty",
          data: null,
        };
      }

      const supplierRepo = queryRunner
        // @ts-ignore
        ? queryRunner.manager.getRepository(Supplier)
        : AppDataSource.getRepository(Supplier);

      const importedSuppliers = [];
      const updatedSuppliers = [];
      const errors = [];

      // Process each supplier
      for (let i = 0; i < suppliers.length; i++) {
        const supplierData = suppliers[i];

        try {
          // Validate required fields
          if (!supplierData.name) {
            errors.push(`Row ${i + 1}: Supplier name is required`);
            continue;
          }

          // Generate code if not provided
          if (!supplierData.code) {
            supplierData.code = await this.generateSupplierCode(
              supplierData.name,
              supplierRepo,
            );
          } else {
            supplierData.code = supplierData.code.toUpperCase();
          }

          // Check if supplier already exists
          let existingSupplier = null;

          // Try to find by code first
          if (supplierData.code) {
            existingSupplier = await supplierRepo.findOne({
              where: { code: supplierData.code },
            });
          }

          // If not found by code, try by name
          if (!existingSupplier) {
            existingSupplier = await supplierRepo.findOne({
              where: {
                name: supplierData.name,
                is_active: true,
              },
            });
          }

          if (existingSupplier) {
            if (overwrite) {
              // Update existing supplier
              Object.assign(existingSupplier, supplierData);
              existingSupplier.is_active = true;
              existingSupplier.updated_at = new Date();

              const updatedSupplier = await supplierRepo.save(existingSupplier);
              updatedSuppliers.push(updatedSupplier);
            } else {
              errors.push(
                `Row ${i + 1}: Supplier "${supplierData.name}" already exists`,
              );
            }
          } else {
            // Create new supplier
            const supplier = supplierRepo.create({
              ...supplierData,
              is_active: true,
            });

            const savedSupplier = await supplierRepo.save(supplier);
            importedSuppliers.push(savedSupplier);
          }
        } catch (error) {
          // @ts-ignore
          errors.push(`Row ${i + 1}: ${error.message}`);
        }
      }

      // Log activity
      if (
        _userId &&
        (importedSuppliers.length > 0 || updatedSuppliers.length > 0)
      ) {
        const activityRepo = queryRunner
          // @ts-ignore
          ? queryRunner.manager.getRepository(
              require("../../../entities/UserActivity"),
            )
          : AppDataSource.getRepository(
              require("../../../entities/UserActivity"),
            );

        await activityRepo.save({
          user_id: _userId,
          action: "supplier_import",
          entity: "Supplier",
          entity_id: null,
          description: `Imported ${importedSuppliers.length} new suppliers, updated ${updatedSuppliers.length} existing suppliers`,
        });
      }

      return {
        status:
          errors.length === 0 ||
          importedSuppliers.length > 0 ||
          updatedSuppliers.length > 0,
        message: `Import completed: ${importedSuppliers.length} new, ${updatedSuppliers.length} updated, ${errors.length} errors`,
        data: {
          imported: importedSuppliers,
          updated: updatedSuppliers,
          errors: errors,
          totalProcessed: suppliers.length,
          newCount: importedSuppliers.length,
          updatedCount: updatedSuppliers.length,
          errorCount: errors.length,
        },
      };
    } catch (error) {
      console.error("Import suppliers error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to import suppliers",
        data: null,
      };
    }
  }

  /**
   * Get all suppliers with pagination and filters
   * @param {{
   *   page?: number,
   *   limit?: number,
   *   search?: string,
   *   sortBy?: string,
   *   sortOrder?: 'ASC' | 'DESC',
   *   activeOnly?: boolean,
   *   _userId: number
   * }} params
   */
  async getAllSuppliers(params) {
    const {
      page = 1,
      limit = 20,
      search = "",
      sortBy = "created_at",
      sortOrder = "DESC",
      activeOnly = true,
      // @ts-ignore
      _userId,
    } = params;

    try {
      const supplierRepo = AppDataSource.getRepository(Supplier);
      const skip = (page - 1) * limit;

      // Build query
      const queryBuilder = supplierRepo
        .createQueryBuilder("supplier")
        .leftJoinAndSelect("supplier.products", "products")
        .where("products.is_deleted = :notDeleted", { notDeleted: false });

      // Filter by active status
      if (activeOnly) {
        queryBuilder.andWhere("supplier.is_active = :isActive", {
          isActive: true,
        });
      }

      // Apply search filter
      if (search && search.trim().length >= 2) {
        queryBuilder.andWhere(
          "(supplier.name LIKE :search OR supplier.code LIKE :search OR supplier.email LIKE :search OR supplier.contact_person LIKE :search)",
          { search: `%${search}%` },
        );
      }

      // Count total
      const total = await queryBuilder.getCount();

      // Apply sorting and pagination
      const suppliers = await queryBuilder
        .orderBy(`supplier.${sortBy}`, sortOrder)
        .skip(skip)
        .take(limit)
        .getMany();

      // Get product counts for each supplier
      const suppliersWithCounts = await Promise.all(
        suppliers.map(async (supplier) => {
          // @ts-ignore
          const productCount = supplier.products ? supplier.products.length : 0;

          return {
            ...supplier,
            productCount,
            products: undefined, // Remove products array to reduce payload
          };
        }),
      );

      return {
        status: true,
        message: "Suppliers retrieved successfully",
        data: {
          suppliers: suppliersWithCounts,
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
      console.error("Get all suppliers error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to retrieve suppliers",
        data: null,
      };
    }
  }

  /**
   * Search suppliers by various criteria
   * @param {{ query: string, field?: string, _userId: number }} params
   */
  async searchSuppliers(params) {
    // @ts-ignore
    const { query, field = "all", _userId } = params;

    try {
      if (!query || query.trim().length < 2) {
        return {
          status: false,
          message: "Search query must be at least 2 characters",
          data: [],
        };
      }

      const supplierRepo = AppDataSource.getRepository(Supplier);

      // Build query
      const queryBuilder = supplierRepo
        .createQueryBuilder("supplier")
        .where("supplier.is_active = :isActive", { isActive: true });

      // Apply field-specific search
      switch (field) {
        case "name":
          queryBuilder.andWhere("supplier.name LIKE :query", {
            query: `%${query}%`,
          });
          break;
        case "code":
          queryBuilder.andWhere("supplier.code LIKE :query", {
            query: `%${query}%`,
          });
          break;
        case "email":
          queryBuilder.andWhere("supplier.email LIKE :query", {
            query: `%${query}%`,
          });
          break;
        case "contact":
          queryBuilder.andWhere("supplier.contact_person LIKE :query", {
            query: `%${query}%`,
          });
          break;
        case "phone":
          queryBuilder.andWhere("supplier.phone LIKE :query", {
            query: `%${query}%`,
          });
          break;
        default:
          queryBuilder.andWhere(
            "(supplier.name LIKE :query OR supplier.code LIKE :query OR supplier.email LIKE :query OR supplier.contact_person LIKE :query OR supplier.phone LIKE :query)",
            { query: `%${query}%` },
          );
      }

      const suppliers = await queryBuilder
        .orderBy("supplier.name", "ASC")
        .limit(50)
        .getMany();

      return {
        status: true,
        message: "Suppliers search completed",
        data: suppliers,
      };
    } catch (error) {
      console.error("Search suppliers error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to search suppliers",
        data: null,
      };
    }
  }

  /**
   * Get active suppliers for dropdowns
   * @param {{ _userId: number }} params
   */
  async getActiveSuppliers(params) {
    // @ts-ignore
    const { _userId } = params;

    try {
      const supplierRepo = AppDataSource.getRepository(Supplier);

      const suppliers = await supplierRepo
        .createQueryBuilder("supplier")
        .select([
          "supplier.id",
          "supplier.name",
          "supplier.code",
          "supplier.contact_person",
          "supplier.phone",
        ])
        .where("supplier.is_active = :isActive", { isActive: true })
        .orderBy("supplier.name", "ASC")
        .getMany();

      return {
        status: true,
        message: "Active suppliers retrieved successfully",
        data: suppliers,
      };
    } catch (error) {
      console.error("Get active suppliers error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to retrieve active suppliers",
        data: null,
      };
    }
  }

  /**
   * Get suppliers with product count
   * @param {{ minProducts?: number, _userId: number }} params
   */
  async getSuppliersWithProductCount(params) {
    // @ts-ignore
    const { minProducts = 0, _userId } = params;

    try {
      const supplierRepo = AppDataSource.getRepository(Supplier);
      const productRepo = AppDataSource.getRepository(Product);

      // Get all active suppliers
      const suppliers = await supplierRepo
        .createQueryBuilder("supplier")
        .where("supplier.is_active = :isActive", { isActive: true })
        .orderBy("supplier.name", "ASC")
        .getMany();

      // Get product counts for each supplier
      const suppliersWithCounts = await Promise.all(
        suppliers.map(async (supplier) => {
          const productCount = await productRepo.count({
            // @ts-ignore
            where: {
              supplier_id: supplier.id,
              is_deleted: false,
            },
          });

          return {
            ...supplier,
            productCount,
          };
        }),
      );

      // Filter by minimum products if specified
      const filteredSuppliers =
        minProducts > 0
          ? suppliersWithCounts.filter((s) => s.productCount >= minProducts)
          : suppliersWithCounts;

      return {
        status: true,
        message: `Suppliers with product count retrieved (${filteredSuppliers.length} suppliers)`,
        data: filteredSuppliers,
      };
    } catch (error) {
      console.error("Get suppliers with product count error:", error);
      return {
        status: false,
        message:
          // @ts-ignore
          error.message || "Failed to retrieve suppliers with product count",
        data: null,
      };
    }
  }

  /**
   * Get products by supplier
   * @param {{ supplierId: number, page?: number, limit?: number, _userId: number }} params
   */
  async getSupplierProducts(params) {
    // @ts-ignore
    const { supplierId, page = 1, limit = 50, _userId } = params;

    try {
      const supplierRepo = AppDataSource.getRepository(Supplier);
      const productRepo = AppDataSource.getRepository(Product);
      const skip = (page - 1) * limit;

      // Check if supplier exists
      const supplier = await supplierRepo.findOne({
        where: { id: supplierId, is_active: true },
        select: ["id", "name", "code"],
      });

      if (!supplier) {
        return {
          status: false,
          message: `Supplier with ID ${supplierId} not found`,
          data: null,
        };
      }

      // Get products with pagination
      const [products, total] = await productRepo.findAndCount({
        where: {
          supplier_id: supplierId,
          is_deleted: false,
        },
        order: { name: "ASC" },
        skip: skip,
        take: limit,
      });

      // Get product statistics
      const productStats = await productRepo
        .createQueryBuilder("product")
        .select([
          "COUNT(product.id) as total_products",
          "SUM(product.stock) as total_stock",
          "SUM(product.total_sold) as total_sold",
          "AVG(product.cost_price) as avg_cost_price",
          "AVG(product.selling_price) as avg_selling_price",
        ])
        .where("product.supplier_id = :supplierId", { supplierId })
        .andWhere("product.is_deleted = :notDeleted", { notDeleted: false })
        .getRawOne();

      const stats = {
        totalProducts: parseInt(productStats.total_products) || 0,
        totalStock: parseInt(productStats.total_stock) || 0,
        totalSold: parseInt(productStats.total_sold) || 0,
        avgCostPrice: parseFloat(productStats.avg_cost_price) || 0,
        avgSellingPrice: parseFloat(productStats.avg_selling_price) || 0,
        avgProfitMargin:
          productStats.avg_selling_price && productStats.avg_cost_price
            ? ((parseFloat(productStats.avg_selling_price) -
                parseFloat(productStats.avg_cost_price)) /
                parseFloat(productStats.avg_selling_price)) *
              100
            : 0,
      };

      return {
        status: true,
        message: `Retrieved ${products.length} products for supplier`,
        data: {
          supplier,
          products,
          stats,
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
      console.error("Get supplier products error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to retrieve supplier products",
        data: null,
      };
    }
  }

  /**
   * Get supplier performance metrics
   * @param {{ supplierId: number, period?: string, _userId: number }} params
   */
  async getSupplierPerformance(params) {
    // @ts-ignore
    const { supplierId, period = "month", _userId } = params;

    try {
      const supplierRepo = AppDataSource.getRepository(Supplier);

      // Check if supplier exists
      const supplier = await supplierRepo.findOne({
        where: { id: supplierId, is_active: true },
        select: ["id", "name", "code"],
      });

      if (!supplier) {
        return {
          status: false,
          message: `Supplier with ID ${supplierId} not found`,
          data: null,
        };
      }

      // Get sales data (this would require a sales repository and more complex query)
      // For now, we'll return basic performance metrics

      const productRepo = AppDataSource.getRepository(Product);

      // Get product performance metrics
      const performance = await productRepo
        .createQueryBuilder("product")
        .select([
          "COUNT(product.id) as total_products",
          "SUM(product.total_sold) as total_units_sold",
          "SUM(product.total_sold * product.selling_price) as total_revenue",
          "SUM(product.total_sold * product.cost_price) as total_cost",
          "AVG(product.selling_price - product.cost_price) as avg_profit_per_unit",
        ])
        .where("product.supplier_id = :supplierId", { supplierId })
        .andWhere("product.is_deleted = :notDeleted", { notDeleted: false })
        .getRawOne();

      const totalRevenue = parseFloat(performance.total_revenue) || 0;
      const totalCost = parseFloat(performance.total_cost) || 0;
      const totalProfit = totalRevenue - totalCost;
      const profitMargin =
        totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      const performanceMetrics = {
        totalProducts: parseInt(performance.total_products) || 0,
        totalUnitsSold: parseInt(performance.total_units_sold) || 0,
        totalRevenue: totalRevenue,
        totalCost: totalCost,
        totalProfit: totalProfit,
        profitMargin: parseFloat(profitMargin.toFixed(2)),
        avgProfitPerUnit: parseFloat(performance.avg_profit_per_unit) || 0,
        period: period,
      };

      return {
        status: true,
        message: "Supplier performance metrics retrieved",
        data: {
          supplier,
          performance: performanceMetrics,
        },
      };
    } catch (error) {
      console.error("Get supplier performance error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to retrieve supplier performance",
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
        logger.info(`SupplierHandler: ${method}`, {
          method,
          userId,
          hasParams: !!Object.keys(params).length,
        });
      }

      // Route to appropriate method
      switch (method) {
        // 📦 CRUD OPERATIONS
        case "createSupplier":
          return await this.handleWithTransaction(
            this.createSupplier,
            enrichedParams,
          );

        case "updateSupplier":
          return await this.handleWithTransaction(
            this.updateSupplier,
            enrichedParams,
          );

        case "deleteSupplier":
          return await this.handleWithTransaction(
            this.deleteSupplier,
            enrichedParams,
          );

        case "getSupplierById":
          return await this.getSupplierById(enrichedParams);

        // 📋 BULK OPERATIONS
        case "bulkUpdateSuppliers":
          return await this.handleWithTransaction(
            this.bulkUpdateSuppliers,
            enrichedParams,
          );

        case "importSuppliers":
          return await this.handleWithTransaction(
            // @ts-ignore
            this.importSuppliers,
            enrichedParams,
          );

        // 🔍 READ-ONLY OPERATIONS
        case "getAllSuppliers":
          return await this.getAllSuppliers(enrichedParams);

        case "searchSuppliers":
          return await this.searchSuppliers(enrichedParams);

        case "getActiveSuppliers":
          return await this.getActiveSuppliers(enrichedParams);

        case "getSuppliersWithProductCount":
          return await this.getSuppliersWithProductCount(enrichedParams);

        case "getSupplierProducts":
          return await this.getSupplierProducts(enrichedParams);

        case "getSupplierPerformance":
          return await this.getSupplierPerformance(enrichedParams);

        default:
          return {
            status: false,
            message: `Method '${method}' not available in SupplierHandler`,
            data: null,
          };
      }
    } catch (error) {
      console.error("SupplierHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("SupplierHandler error:", error);
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
const supplierHandler = new SupplierHandler();

ipcMain.handle(
  "supplier",
  withErrorHandling(
    // @ts-ignore
    supplierHandler.handleRequest.bind(supplierHandler),
    "IPC:supplier",
  ),
);

module.exports = { SupplierHandler, supplierHandler };
