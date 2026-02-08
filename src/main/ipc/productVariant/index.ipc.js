// src/ipc/variant/variant.ipc.js - Complete Product Variant Handler
// @ts-check
const { ipcMain } = require("electron");
const { withErrorHandling } = require("../../../utils/errorHandler");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/dataSource");
const { Product } = require("../../../entities/Product");
const InventoryTransactionLog = require("../../../entities/InventoryTransactionLogs");
const ProductVariant = require("../../../entities/ProductVariant");

class VariantHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // ✅ CRUD OPERATIONS
    this.createVariant = this.createVariant.bind(this);
    this.updateVariant = this.updateVariant.bind(this);
    this.deleteVariant = this.deleteVariant.bind(this);
    this.getVariantById = this.getVariantById.bind(this);
    this.bulkCreateVariants = this.bulkCreateVariants.bind(this);
    
    // ✅ INVENTORY OPERATIONS
    this.updateVariantStock = this.updateVariantStock.bind(this);
    this.adjustVariantInventory = this.adjustVariantInventory.bind(this);
    this.syncVariantWithParent = this.syncVariantWithParent.bind(this);
    
    // ✅ READ-ONLY HANDLERS
    this.getVariantsByProduct = this.getVariantsByProduct.bind(this);
    this.searchVariants = this.searchVariants.bind(this);
    this.getVariantByBarcode = this.getVariantByBarcode.bind(this);
    this.getVariantBySku = this.getVariantBySku.bind(this);
    this.getVariantsWithLowStock = this.getVariantsWithLowStock.bind(this);
  }

  /**
   * Create a new product variant
   * @param {{ variantData: object, _userId: number, warehouse_id?: string }} params
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  // @ts-ignore
  async createVariant(params, queryRunner = null) {
    const { variantData, _userId, warehouse_id } = params;
    
    try {
      const variantRepo = queryRunner 
        ? queryRunner.manager.getRepository(ProductVariant)
        : AppDataSource.getRepository(ProductVariant);
      
      const productRepo = queryRunner 
        ? queryRunner.manager.getRepository(Product)
        : AppDataSource.getRepository(Product);
      
      // Validate required fields
      // @ts-ignore
      if (!variantData.product_id || !variantData.sku || !variantData.variant_name) {
        return {
          status: false,
          message: "Product ID, SKU, and variant name are required",
          data: null,
        };
      }
      
      // Check if parent product exists and is variable type
      const parentProduct = await productRepo.findOne({
        where: { 
          // @ts-ignore
          id: variantData.product_id,
          is_deleted: false 
        },
      });
      
      if (!parentProduct) {
        return {
          status: false,
          // @ts-ignore
          message: `Parent product with ID ${variantData.product_id} not found`,
          data: null,
        };
      }
      
      // Check if product is variable type
      if (parentProduct.product_type !== 'variable') {
        return {
          status: false,
          message: `Parent product is not a variable type product`,
          data: null,
        };
      }
      
      // Check if SKU already exists
      const existingBySku = await variantRepo.findOne({
        where: { 
          // @ts-ignore
          sku: variantData.sku,
          is_active: true 
        },
      });
      
      if (existingBySku) {
        return {
          status: false,
          // @ts-ignore
          message: `Variant with SKU "${variantData.sku}" already exists`,
          data: null,
        };
      }
      
      // Check if barcode already exists (if provided)
      // @ts-ignore
      if (variantData.barcode) {
        const existingByBarcode = await variantRepo.findOne({
          where: { 
            // @ts-ignore
            barcode: variantData.barcode,
            is_active: true 
          },
        });
        
        if (existingByBarcode) {
          return {
            status: false,
            // @ts-ignore
            message: `Variant with barcode "${variantData.barcode}" already exists`,
            data: null,
          };
        }
      }
      
      // Check if same variant attributes already exist for this product
      // @ts-ignore
      if (variantData.attributes) {
        const existingByAttributes = await variantRepo.findOne({
          where: { 
            // @ts-ignore
            product_id: variantData.product_id,
            // @ts-ignore
            attributes: variantData.attributes,
            is_active: true 
          },
        });
        
        if (existingByAttributes) {
          return {
            status: false,
            message: `Variant with same attributes already exists for this product`,
            data: null,
          };
        }
      }
      
      // Calculate price if not provided (base price + adjustment)
      // @ts-ignore
      if (!variantData.price_adjustment && variantData.price_adjustment !== 0) {
        // @ts-ignore
        variantData.price_adjustment = 0;
      }
      
      // Create new variant
      const variant = variantRepo.create({
        ...variantData,
        is_active: true,
      });
      
      const savedVariant = await variantRepo.save(variant);
      
      // Log inventory transaction if initial stock is provided
      // @ts-ignore
      if (variantData.stock && variantData.stock > 0) {
        const inventoryLogRepo = queryRunner 
          ? queryRunner.manager.getRepository(InventoryTransactionLog)
          : AppDataSource.getRepository(InventoryTransactionLog);
        
        const inventoryLog = inventoryLogRepo.create({
          // @ts-ignore
          product_id: savedVariant.id.toString(),
          warehouse_id: warehouse_id || null,
          action: 'VARIANT_CREATED',
          // @ts-ignore
          change_amount: variantData.stock,
          quantity_before: 0,
          // @ts-ignore
          quantity_after: variantData.stock,
          price_before: null,
          price_after: null,
          // @ts-ignore
          reference_id: savedVariant.id.toString(),
          reference_type: 'variant_creation',
          performed_by_id: _userId ? _userId.toString() : null,
          notes: `Initial stock for variant: ${savedVariant.variant_name}`,
        });
        
        await inventoryLogRepo.save(inventoryLog);
      }
      
      // Update parent product stock if needed (sum of all variants)
      // @ts-ignore
      await this.updateParentProductStock(variantData.product_id, variantRepo, productRepo);
      
      // Log activity
      if (_userId) {
        const activityRepo = queryRunner 
          ? queryRunner.manager.getRepository(require("../../../entities/UserActivity"))
          : AppDataSource.getRepository(require("../../../entities/UserActivity"));
        
        await activityRepo.save({
          user_id: _userId,
          action: "variant_create",
          entity: "ProductVariant",
          entity_id: savedVariant.id,
          // @ts-ignore
          description: `Created variant: ${savedVariant.variant_name} (SKU: ${savedVariant.sku}) for product ID ${variantData.product_id}`,
        });
      }
      
      return {
        status: true,
        message: "Variant created successfully",
        data: savedVariant,
      };
      
    } catch (error) {
      console.error("Create variant error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to create variant",
        data: null,
      };
    }
  }

 
  /**
     * @param {unknown} productId
     * @param {import("typeorm").Repository<{ id: unknown; product_id: unknown; sku: unknown; variant_name: unknown; attributes: unknown; price_adjustment: unknown; stock: unknown; barcode: unknown; image_url: unknown; is_active: unknown; created_at: unknown; updated_at: unknown; }>} variantRepo
     * @param {import("typeorm").Repository<{ id: unknown; sku: unknown; barcode: unknown; upc: unknown; name: unknown; display_name: unknown; description: unknown; product_type: unknown; category_id: unknown; subcategory_id: unknown; brand_id: unknown; cost_price: unknown; selling_price: unknown; wholesale_price: unknown; min_price: unknown; max_price: unknown; markup_percentage: unknown; stock: unknown; reserved_stock: unknown; available_stock: unknown; min_stock_level: unknown; max_stock_level: unknown; reorder_level: unknown; tax_rate: unknown; tax_type: unknown; is_taxable: unknown; discount_percentage: unknown; discount_amount: unknown; weight: unknown; weight_unit: unknown; length: unknown; width: unknown; height: unknown; dimension_unit: unknown; supplier_id: unknown; supplier_sku: unknown; supplier_price: unknown; lead_time_days: unknown; has_expiry: unknown; shelf_life_days: unknown; track_batch: unknown; track_serial: unknown; image_url: unknown; image_urls: unknown; thumbnail_url: unknown; pos_quick_code: unknown; pos_category_id: unknown; is_quick_sale: unknown; is_hidden: unknown; kitchen_printer_id: unknown; preparation_time: unknown; loyalty_points_earn: unknown; is_reward_product: unknown; reward_points_cost: unknown; status: unknown; is_active: unknown; is_deleted: unknown; is_bestseller: unknown; is_featured: unknown; is_new: unknown; tags: unknown; attributes: unknown; specifications: unknown; created_at: unknown; updated_at: unknown; deleted_at: unknown; last_sold_at: unknown; last_received_at: unknown; created_by: unknown; updated_by: unknown; deleted_by: unknown; total_sold: unknown; total_returned: unknown; total_profit: unknown; average_rating: unknown; review_count: unknown; }>} productRepo
     */
  async updateParentProductStock(productId, variantRepo, productRepo) {
    try {
      // Calculate total stock from all active variants
      const variants = await variantRepo.find({
        // @ts-ignore
        where: { 
          product_id: productId,
          is_active: true 
        },
        select: ['stock']
      });
      
      const totalStock = variants.reduce((/** @type {any} */ sum, /** @type {{ stock: any; }} */ variant) => sum + (variant.stock || 0), 0);
      
      // Update parent product stock
      // @ts-ignore
      await productRepo.update(productId, {
        stock: totalStock,
        available_stock: totalStock,
        updated_at: new Date()
      });
      
      return totalStock;
    } catch (error) {
      console.error("Update parent product stock error:", error);
      throw error;
    }
  }

  /**
   * Update existing variant
   * @param {{ variantId: number, variantData: object, _userId: number }} params
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  // @ts-ignore
  async updateVariant(params, queryRunner = null) {
    const { variantId, variantData, _userId } = params;
    
    try {
      const variantRepo = queryRunner 
        ? queryRunner.manager.getRepository(ProductVariant)
        : AppDataSource.getRepository(ProductVariant);
      
      const productRepo = queryRunner 
        ? queryRunner.manager.getRepository(Product)
        : AppDataSource.getRepository(Product);
      
      // Find variant
      const variant = await variantRepo.findOne({
        where: { id: variantId, is_active: true },
        relations: ['parent']
      });
      
      if (!variant) {
        return {
          status: false,
          message: `Variant with ID ${variantId} not found`,
          data: null,
        };
      }
      
      // Check if SKU is being changed and conflicts with another variant
      // @ts-ignore
      if (variantData.sku && variantData.sku !== variant.sku) {
        const existingBySku = await variantRepo.findOne({
          where: { 
            // @ts-ignore
            sku: variantData.sku,
            is_active: true,
            id: { $not: variantId }
          },
        });
        
        if (existingBySku) {
          return {
            status: false,
            // @ts-ignore
            message: `Variant with SKU "${variantData.sku}" already exists`,
            data: null,
          };
        }
      }
      
      // Check if barcode is being changed and conflicts
      // @ts-ignore
      if (variantData.barcode && variantData.barcode !== variant.barcode) {
        const existingByBarcode = await variantRepo.findOne({
          where: { 
            // @ts-ignore
            barcode: variantData.barcode,
            is_active: true,
            id: { $not: variantId }
          },
        });
        
        if (existingByBarcode) {
          return {
            status: false,
            // @ts-ignore
            message: `Variant with barcode "${variantData.barcode}" already exists`,
            data: null,
          };
        }
      }
      
      // Check if attributes are being changed and conflict with another variant of same product
      // @ts-ignore
      if (variantData.attributes && JSON.stringify(variantData.attributes) !== JSON.stringify(variant.attributes)) {
        const existingByAttributes = await variantRepo.findOne({
          // @ts-ignore
          where: { 
            product_id: variant.product_id,
            // @ts-ignore
            attributes: variantData.attributes,
            is_active: true,
            id: { $not: variantId }
          },
        });
        
        if (existingByAttributes) {
          return {
            status: false,
            message: `Variant with same attributes already exists for this product`,
            data: null,
          };
        }
      }
      
      // Store old stock for inventory log
      const oldStock = variant.stock;
      
      // Update variant
      Object.assign(variant, variantData);
      variant.updated_at = new Date();
      
      const updatedVariant = await variantRepo.save(variant);
      
      // Log inventory transaction if stock changed
      // @ts-ignore
      if (variantData.stock !== undefined && variantData.stock !== oldStock) {
        const inventoryLogRepo = queryRunner 
          ? queryRunner.manager.getRepository(InventoryTransactionLog)
          : AppDataSource.getRepository(InventoryTransactionLog);
        
        // @ts-ignore
        const stockChange = variantData.stock - oldStock;
        const action = stockChange > 0 ? 'VARIANT_STOCK_INCREASE' : 'VARIANT_STOCK_DECREASE';
        
        const inventoryLog = inventoryLogRepo.create({
          product_id: variantId.toString(),
          warehouse_id: null,
          action: action,
          change_amount: Math.abs(stockChange),
          quantity_before: oldStock,
          // @ts-ignore
          quantity_after: variantData.stock,
          price_before: null,
          price_after: null,
          reference_id: variantId.toString(),
          reference_type: 'variant_update',
          performed_by_id: _userId ? _userId.toString() : null,
          notes: `Stock adjustment for variant: ${variant.variant_name}`,
        });
        
        await inventoryLogRepo.save(inventoryLog);
      }
      
      // Update parent product stock
      // @ts-ignore
      await this.updateParentProductStock(variant.product_id, variantRepo, productRepo);
      
      // Log activity
      if (_userId) {
        const activityRepo = queryRunner 
          ? queryRunner.manager.getRepository(require("../../../entities/UserActivity"))
          : AppDataSource.getRepository(require("../../../entities/UserActivity"));
        
        await activityRepo.save({
          user_id: _userId,
          action: "variant_update",
          entity: "ProductVariant",
          entity_id: updatedVariant.id,
          description: `Updated variant: ${updatedVariant.variant_name} (ID: ${variantId})`,
        });
      }
      
      return {
        status: true,
        message: "Variant updated successfully",
        data: updatedVariant,
      };
      
    } catch (error) {
      console.error("Update variant error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to update variant",
        data: null,
      };
    }
  }

  /**
   * Delete variant (soft delete)
   * @param {{ variantId: number, _userId: number }} params
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  // @ts-ignore
  async deleteVariant(params, queryRunner = null) {
    const { variantId, _userId } = params;
    
    try {
      const variantRepo = queryRunner 
        ? queryRunner.manager.getRepository(ProductVariant)
        : AppDataSource.getRepository(ProductVariant);
      
      const productRepo = queryRunner 
        ? queryRunner.manager.getRepository(Product)
        : AppDataSource.getRepository(Product);
      
      // Find variant
      const variant = await variantRepo.findOne({
        where: { id: variantId, is_active: true },
      });
      
      if (!variant) {
        return {
          status: false,
          message: `Variant with ID ${variantId} not found`,
          data: null,
        };
      }
      
      // Check if variant has stock (warn user)
      // @ts-ignore
      if (variant.stock > 0) {
        return {
          status: false,
          message: `Cannot delete variant with ${variant.stock} units in stock. Please adjust stock to zero first.`,
          data: { currentStock: variant.stock },
        };
      }
      
      // Check if variant is referenced in any sales
      const saleItemRepo = queryRunner 
        ? queryRunner.manager.getRepository(require("../../../entities/SaleItem"))
        : AppDataSource.getRepository(require("../../../entities/SaleItem"));
      
      const saleReferences = await saleItemRepo.count({
        where: { 
          sync_id: variantId.toString(),
          is_returned: false 
        },
      });
      
      if (saleReferences > 0) {
        return {
          status: false,
          message: `Cannot delete variant. It is referenced in ${saleReferences} sale item(s).`,
          data: null,
        };
      }
      
      // Soft delete variant
      variant.is_active = false;
      variant.updated_at = new Date();
      
      await variantRepo.save(variant);
      
      // Update parent product stock
      // @ts-ignore
      await this.updateParentProductStock(variant.product_id, variantRepo, productRepo);
      
      // Log activity
      if (_userId) {
        const activityRepo = queryRunner 
          ? queryRunner.manager.getRepository(require("../../../entities/UserActivity"))
          : AppDataSource.getRepository(require("../../../entities/UserActivity"));
        
        await activityRepo.save({
          user_id: _userId,
          action: "variant_delete",
          entity: "ProductVariant",
          entity_id: variantId,
          description: `Deleted variant: ${variant.variant_name} (SKU: ${variant.sku})`,
        });
      }
      
      return {
        status: true,
        message: "Variant deleted successfully",
        data: { id: variantId },
      };
      
    } catch (error) {
      console.error("Delete variant error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to delete variant",
        data: null,
      };
    }
  }

  /**
   * Get variant by ID
   * @param {{ variantId: number, _userId: number }} params
   */
  async getVariantById(params) {
    // @ts-ignore
    // @ts-ignore
    const { variantId, _userId } = params;
    
    try {
      const variantRepo = AppDataSource.getRepository(ProductVariant);
      
      const variant = await variantRepo.findOne({
        where: { id: variantId, is_active: true },
        relations: ['parent']
      });
      
      if (!variant) {
        return {
          status: false,
          message: `Variant with ID ${variantId} not found`,
          data: null,
        };
      }
      
      // Calculate selling price (parent price + adjustment)
      // @ts-ignore
      const parentProduct = variant.parent;
      const sellingPrice = parentProduct 
        // @ts-ignore
        ? (parseFloat(parentProduct.selling_price) + parseFloat(variant.price_adjustment || 0))
        : 0;
      
      const variantWithPrice = {
        ...variant,
        selling_price: sellingPrice,
        parent_price: parentProduct ? parentProduct.selling_price : 0
      };
      
      return {
        status: true,
        message: "Variant retrieved successfully",
        data: variantWithPrice,
      };
      
    } catch (error) {
      console.error("Get variant by ID error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to retrieve variant",
        data: null,
      };
    }
  }


  // @ts-ignore
  async bulkCreateVariants(params, queryRunner = null) {
    const { productId, variants, _userId, warehouse_id } = params;
    
    try {
      if (!variants || !Array.isArray(variants) || variants.length === 0) {
        return {
          status: false,
          message: "Variants array is required and cannot be empty",
          data: null,
        };
      }
      
      const variantRepo = queryRunner 
        // @ts-ignore
        ? queryRunner.manager.getRepository(ProductVariant)
        : AppDataSource.getRepository(ProductVariant);
      
      const productRepo = queryRunner 
        // @ts-ignore
        ? queryRunner.manager.getRepository(Product)
        : AppDataSource.getRepository(Product);
      
      // Check if parent product exists and is variable type
      const parentProduct = await productRepo.findOne({
        where: { 
          id: productId,
          is_deleted: false 
        },
      });
      
      if (!parentProduct) {
        return {
          status: false,
          message: `Parent product with ID ${productId} not found`,
          data: null,
        };
      }
      
      if (parentProduct.product_type !== 'variable') {
        return {
          status: false,
          message: `Parent product is not a variable type product`,
          data: null,
        };
      }
      
      const createdVariants = [];
      const errors = [];
      
      // Process each variant
      for (let i = 0; i < variants.length; i++) {
        const variantData = variants[i];
        
        try {
          // Set product ID
          variantData.product_id = productId;
          
          // Validate required fields
          if (!variantData.sku || !variantData.variant_name) {
            errors.push(`Variant ${i + 1}: SKU and variant name are required`);
            continue;
          }
          
          // Check SKU uniqueness
          const existingBySku = await variantRepo.findOne({
            where: { 
              sku: variantData.sku,
              is_active: true 
            },
          });
          
          if (existingBySku) {
            errors.push(`Variant ${i + 1}: SKU "${variantData.sku}" already exists`);
            continue;
          }
          
          // Check barcode uniqueness
          if (variantData.barcode) {
            const existingByBarcode = await variantRepo.findOne({
              where: { 
                barcode: variantData.barcode,
                is_active: true 
              },
            });
            
            if (existingByBarcode) {
              errors.push(`Variant ${i + 1}: Barcode "${variantData.barcode}" already exists`);
              continue;
            }
          }
          
          // Check attribute uniqueness
          if (variantData.attributes) {
            const existingByAttributes = await variantRepo.findOne({
              where: { 
                product_id: productId,
                attributes: variantData.attributes,
                is_active: true 
              },
            });
            
            if (existingByAttributes) {
              errors.push(`Variant ${i + 1}: Variant with same attributes already exists`);
              continue;
            }
          }
          
          // Create variant
          const variant = variantRepo.create({
            ...variantData,
            is_active: true,
          });
          
          const savedVariant = await variantRepo.save(variant);
          createdVariants.push(savedVariant);
          
          // Log inventory transaction if initial stock provided
          if (variantData.stock && variantData.stock > 0) {
            const inventoryLogRepo = queryRunner 
              // @ts-ignore
              ? queryRunner.manager.getRepository(InventoryTransactionLog)
              : AppDataSource.getRepository(InventoryTransactionLog);
            
            const inventoryLog = inventoryLogRepo.create({
              // @ts-ignore
              product_id: savedVariant.id.toString(),
              warehouse_id: warehouse_id || null,
              action: 'VARIANT_CREATED',
              change_amount: variantData.stock,
              quantity_before: 0,
              quantity_after: variantData.stock,
              price_before: null,
              price_after: null,
              // @ts-ignore
              reference_id: savedVariant.id.toString(),
              reference_type: 'variant_bulk_create',
              performed_by_id: _userId ? _userId.toString() : null,
              // @ts-ignore
              notes: `Bulk create - initial stock for variant: ${savedVariant.variant_name}`,
            });
            
            await inventoryLogRepo.save(inventoryLog);
          }
          
        } catch (error) {
          // @ts-ignore
          errors.push(`Variant ${i + 1}: ${error.message}`);
        }
      }
      
      // Update parent product stock
      await this.updateParentProductStock(productId, variantRepo, productRepo);
      
      // Log activity
      if (_userId && createdVariants.length > 0) {
        const activityRepo = queryRunner 
          // @ts-ignore
          ? queryRunner.manager.getRepository(require("../../../entities/UserActivity"))
          : AppDataSource.getRepository(require("../../../entities/UserActivity"));
        
        await activityRepo.save({
          user_id: _userId,
          action: "variant_bulk_create",
          entity: "ProductVariant",
          entity_id: productId,
          description: `Bulk created ${createdVariants.length} variants for product ID ${productId}`,
        });
      }
      
      return {
        status: errors.length === 0 || createdVariants.length > 0,
        message: errors.length > 0 
          ? `Created ${createdVariants.length} variants with ${errors.length} errors`
          : `Successfully created ${createdVariants.length} variants`,
        data: {
          created: createdVariants,
          errors: errors,
          totalProcessed: variants.length,
          successCount: createdVariants.length,
          errorCount: errors.length
        },
      };
      
    } catch (error) {
      console.error("Bulk create variants error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to bulk create variants",
        data: null,
      };
    }
  }

  /**
   * Update variant stock
   * @param {{ variantId: number, newStock: number, reason?: string, _userId: number, warehouse_id?: string }} params
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  // @ts-ignore
  async updateVariantStock(params, queryRunner = null) {
    const { variantId, newStock, reason = '', _userId, warehouse_id } = params;
    
    try {
      const variantRepo = queryRunner 
        ? queryRunner.manager.getRepository(ProductVariant)
        : AppDataSource.getRepository(ProductVariant);
      
      const productRepo = queryRunner 
        ? queryRunner.manager.getRepository(Product)
        : AppDataSource.getRepository(Product);
      
      // Find variant
      const variant = await variantRepo.findOne({
        where: { id: variantId, is_active: true },
      });
      
      if (!variant) {
        return {
          status: false,
          message: `Variant with ID ${variantId} not found`,
          data: null,
        };
      }
      
      // Validate new stock
      if (newStock < 0) {
        return {
          status: false,
          message: "Stock cannot be negative",
          data: null,
        };
      }
      
      const oldStock = variant.stock;
      // @ts-ignore
      const stockChange = newStock - oldStock;
      
      // Update variant stock
      variant.stock = newStock;
      variant.updated_at = new Date();
      
      await variantRepo.save(variant);
      
      // Log inventory transaction
      const inventoryLogRepo = queryRunner 
        ? queryRunner.manager.getRepository(InventoryTransactionLog)
        : AppDataSource.getRepository(InventoryTransactionLog);
      
      const action = stockChange > 0 ? 'VARIANT_STOCK_INCREASE' : 'VARIANT_STOCK_DECREASE';
      
      const inventoryLog = inventoryLogRepo.create({
        product_id: variantId.toString(),
        warehouse_id: warehouse_id || null,
        action: action,
        change_amount: Math.abs(stockChange),
        quantity_before: oldStock,
        quantity_after: newStock,
        price_before: null,
        price_after: null,
        reference_id: variantId.toString(),
        reference_type: 'variant_stock_update',
        performed_by_id: _userId ? _userId.toString() : null,
        notes: reason || `Stock update for variant: ${variant.variant_name}`,
      });
      
      await inventoryLogRepo.save(inventoryLog);
      
      // Update parent product stock
      // @ts-ignore
      await this.updateParentProductStock(variant.product_id, variantRepo, productRepo);
      
      // Log activity
      if (_userId) {
        const activityRepo = queryRunner 
          ? queryRunner.manager.getRepository(require("../../../entities/UserActivity"))
          : AppDataSource.getRepository(require("../../../entities/UserActivity"));
        
        await activityRepo.save({
          user_id: _userId,
          action: "variant_stock_update",
          entity: "ProductVariant",
          entity_id: variantId,
          description: `Updated stock for variant ${variant.variant_name}: ${oldStock} → ${newStock} (${stockChange > 0 ? '+' : ''}${stockChange})`,
        });
      }
      
      return {
        status: true,
        message: `Variant stock updated from ${oldStock} to ${newStock}`,
        data: {
          variantId,
          oldStock,
          newStock,
          change: stockChange
        },
      };
      
    } catch (error) {
      console.error("Update variant stock error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to update variant stock",
        data: null,
      };
    }
  }

  /**
   * Adjust variant inventory (increase/decrease)
   * @param {{ variantId: number, adjustment: number, reason?: string, _userId: number, warehouse_id?: string }} params
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  // @ts-ignore
  async adjustVariantInventory(params, queryRunner = null) {
    const { variantId, adjustment, reason = '', _userId, warehouse_id } = params;
    
    try {
      const variantRepo = queryRunner 
        ? queryRunner.manager.getRepository(ProductVariant)
        : AppDataSource.getRepository(ProductVariant);
      
      // Find variant
      const variant = await variantRepo.findOne({
        where: { id: variantId, is_active: true },
      });
      
      if (!variant) {
        return {
          status: false,
          message: `Variant with ID ${variantId} not found`,
          data: null,
        };
      }
      
      const oldStock = variant.stock;
      // @ts-ignore
      const newStock = oldStock + adjustment;
      
      // Check if new stock would be negative
      if (newStock < 0) {
        return {
          status: false,
          message: `Cannot adjust stock by ${adjustment}. Current stock: ${oldStock}`,
          data: null,
        };
      }
      
      return await this.updateVariantStock({
        variantId,
        newStock,
        reason: reason || `Inventory adjustment: ${adjustment > 0 ? '+' : ''}${adjustment}`,
        _userId,
        warehouse_id
      }, queryRunner);
      
    } catch (error) {
      console.error("Adjust variant inventory error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to adjust variant inventory",
        data: null,
      };
    }
  }

  /**
   * Sync variant with parent product (update based on parent changes)
   * @param {{ variantId: number, syncFields?: string[], _userId: number }} params
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  // @ts-ignore
  async syncVariantWithParent(params, queryRunner = null) {
    const { variantId, syncFields = ['selling_price'], _userId } = params;
    
    try {
      const variantRepo = queryRunner 
        ? queryRunner.manager.getRepository(ProductVariant)
        : AppDataSource.getRepository(ProductVariant);
      
      // @ts-ignore
      // @ts-ignore
      const productRepo = queryRunner 
        ? queryRunner.manager.getRepository(Product)
        : AppDataSource.getRepository(Product);
      
      // Find variant with parent
      const variant = await variantRepo.findOne({
        where: { id: variantId, is_active: true },
        relations: ['parent']
      });
      
      // @ts-ignore
      if (!variant || !variant.parent) {
        return {
          status: false,
          message: `Variant or its parent product not found`,
          data: null,
        };
      }
      
      // @ts-ignore
      const parentProduct = variant.parent;
      // @ts-ignore
      // @ts-ignore
      const updates = {};
      let changes = [];
      
      // Sync specified fields
      if (syncFields.includes('selling_price')) {
        // Note: Variant price is parent price + adjustment
        // We don't change the adjustment, just recalculate if needed
        if (!variant.price_adjustment) {
          variant.price_adjustment = 0;
          changes.push('price_adjustment set to 0');
        }
      }
      
      // Update variant
      variant.updated_at = new Date();
      const updatedVariant = await variantRepo.save(variant);
      
      // Calculate selling price
      // @ts-ignore
      const sellingPrice = parseFloat(parentProduct.selling_price) + parseFloat(variant.price_adjustment || 0);
      
      // Log activity
      if (_userId && changes.length > 0) {
        const activityRepo = queryRunner 
          ? queryRunner.manager.getRepository(require("../../../entities/UserActivity"))
          : AppDataSource.getRepository(require("../../../entities/UserActivity"));
        
        await activityRepo.save({
          user_id: _userId,
          action: "variant_sync",
          entity: "ProductVariant",
          entity_id: variantId,
          description: `Synced variant with parent product. Changes: ${changes.join(', ')}`,
        });
      }
      
      return {
        status: true,
        message: `Variant synced with parent product${changes.length > 0 ? ` (${changes.length} changes)` : ''}`,
        data: {
          ...updatedVariant,
          selling_price: sellingPrice,
          parent_price: parentProduct.selling_price
        },
      };
      
    } catch (error) {
      console.error("Sync variant with parent error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to sync variant with parent",
        data: null,
      };
    }
  }

  /**
   * Get all variants for a product
   * @param {{ productId: number, includeInactive: boolean, _userId: number }} params
   */
  async getVariantsByProduct(params) {
    // @ts-ignore
    // @ts-ignore
    const { productId, includeInactive = false, _userId } = params;
    
    try {
      const variantRepo = AppDataSource.getRepository(ProductVariant);
      const productRepo = AppDataSource.getRepository(Product);
      
      // Check if product exists
      const product = await productRepo.findOne({
        where: { id: productId, is_deleted: false },
        select: ['id', 'selling_price', 'name']
      });
      
      if (!product) {
        return {
          status: false,
          message: `Product with ID ${productId} not found`,
          data: null,
        };
      }
      
      // Build query
      const queryBuilder = variantRepo
        .createQueryBuilder('variant')
        .where('variant.product_id = :productId', { productId });
      
      if (!includeInactive) {
        queryBuilder.andWhere('variant.is_active = :isActive', { isActive: true });
      }
      
      const variants = await queryBuilder
        .orderBy('variant.variant_name', 'ASC')
        .getMany();
      
      // Calculate selling prices
      const variantsWithPrices = variants.map(variant => ({
        ...variant,
        // @ts-ignore
        selling_price: parseFloat(product.selling_price) + parseFloat(variant.price_adjustment || 0),
        parent_price: product.selling_price
      }));
      
      return {
        status: true,
        message: `Retrieved ${variantsWithPrices.length} variant(s)`,
        data: variantsWithPrices,
      };
      
    } catch (error) {
      console.error("Get variants by product error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to retrieve variants",
        data: null,
      };
    }
  }

  /**
   * Search variants by SKU, barcode, or name
   * @param {{ query: string, productId?: number, _userId: number }} params
   */
  async searchVariants(params) {
    // @ts-ignore
    // @ts-ignore
    const { query, productId, _userId } = params;
    
    try {
      if (!query || query.trim().length < 2) {
        return {
          status: false,
          message: "Search query must be at least 2 characters",
          data: [],
        };
      }
      
      const variantRepo = AppDataSource.getRepository(ProductVariant);
      // @ts-ignore
      // @ts-ignore
      const productRepo = AppDataSource.getRepository(Product);
      
      // Build query
      const queryBuilder = variantRepo
        .createQueryBuilder('variant')
        .leftJoinAndSelect('variant.parent', 'parent')
        .where('variant.is_active = :isActive', { isActive: true })
        .andWhere('(variant.sku LIKE :query OR variant.barcode LIKE :query OR variant.variant_name LIKE :query)', {
          query: `%${query}%`
        });
      
      // Filter by product if specified
      if (productId) {
        queryBuilder.andWhere('variant.product_id = :productId', { productId });
      }
      
      const variants = await queryBuilder
        .orderBy('variant.variant_name', 'ASC')
        .limit(50)
        .getMany();
      
      // Calculate selling prices
      const variantsWithPrices = variants.map(variant => ({
        ...variant,
        // @ts-ignore
        selling_price: variant.parent 
          // @ts-ignore
          ? parseFloat(variant.parent.selling_price) + parseFloat(variant.price_adjustment || 0)
          : 0,
        // @ts-ignore
        parent_price: variant.parent ? variant.parent.selling_price : 0
      }));
      
      return {
        status: true,
        message: "Variants search completed",
        data: variantsWithPrices,
      };
      
    } catch (error) {
      console.error("Search variants error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to search variants",
        data: null,
      };
    }
  }

  /**
   * Get variant by barcode
   * @param {{ barcode: string, _userId: number }} params
   */
  async getVariantByBarcode(params) {
    // @ts-ignore
    // @ts-ignore
    const { barcode, _userId } = params;
    
    try {
      if (!barcode) {
        return {
          status: false,
          message: "Barcode is required",
          data: null,
        };
      }
      
      const variantRepo = AppDataSource.getRepository(ProductVariant);
      
      const variant = await variantRepo.findOne({
        where: { 
          barcode: barcode,
          is_active: true 
        },
        relations: ['parent']
      });
      
      if (!variant) {
        return {
          status: false,
          message: `Variant with barcode "${barcode}" not found`,
          data: null,
        };
      }
      
      // Calculate selling price
      // @ts-ignore
      const sellingPrice = variant.parent 
        // @ts-ignore
        ? parseFloat(variant.parent.selling_price) + parseFloat(variant.price_adjustment || 0)
        : 0;
      
      const variantWithPrice = {
        ...variant,
        selling_price: sellingPrice,
        // @ts-ignore
        parent_price: variant.parent ? variant.parent.selling_price : 0
      };
      
      return {
        status: true,
        message: "Variant retrieved successfully",
        data: variantWithPrice,
      };
      
    } catch (error) {
      console.error("Get variant by barcode error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to retrieve variant",
        data: null,
      };
    }
  }

  /**
   * Get variant by SKU
   * @param {{ sku: string, _userId: number }} params
   */
  async getVariantBySku(params) {
    // @ts-ignore
    // @ts-ignore
    const { sku, _userId } = params;
    
    try {
      if (!sku) {
        return {
          status: false,
          message: "SKU is required",
          data: null,
        };
      }
      
      const variantRepo = AppDataSource.getRepository(ProductVariant);
      
      const variant = await variantRepo.findOne({
        where: { 
          sku: sku,
          is_active: true 
        },
        relations: ['parent']
      });
      
      if (!variant) {
        return {
          status: false,
          message: `Variant with SKU "${sku}" not found`,
          data: null,
        };
      }
      
      // Calculate selling price
      // @ts-ignore
      const sellingPrice = variant.parent 
        // @ts-ignore
        ? parseFloat(variant.parent.selling_price) + parseFloat(variant.price_adjustment || 0)
        : 0;
      
      const variantWithPrice = {
        ...variant,
        selling_price: sellingPrice,
        // @ts-ignore
        parent_price: variant.parent ? variant.parent.selling_price : 0
      };
      
      return {
        status: true,
        message: "Variant retrieved successfully",
        data: variantWithPrice,
      };
      
    } catch (error) {
      console.error("Get variant by SKU error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to retrieve variant",
        data: null,
      };
    }
  }

  /**
   * Get variants with low stock
   * @param {{ threshold: number, productId?: number, _userId: number }} params
   */
  async getVariantsWithLowStock(params) {
    // @ts-ignore
    // @ts-ignore
    const { threshold = 5, productId, _userId } = params;
    
    try {
      const variantRepo = AppDataSource.getRepository(ProductVariant);
      
      // Build query
      const queryBuilder = variantRepo
        .createQueryBuilder('variant')
        .leftJoinAndSelect('variant.parent', 'parent')
        .where('variant.is_active = :isActive', { isActive: true })
        .andWhere('variant.stock <= :threshold', { threshold });
      
      // Filter by product if specified
      if (productId) {
        queryBuilder.andWhere('variant.product_id = :productId', { productId });
      }
      
      const variants = await queryBuilder
        .orderBy('variant.stock', 'ASC')
        .getMany();
      
      // Calculate selling prices and stock status
      const variantsWithStatus = variants.map(variant => {
        // @ts-ignore
        const sellingPrice = variant.parent 
          // @ts-ignore
          ? parseFloat(variant.parent.selling_price) + parseFloat(variant.price_adjustment || 0)
          : 0;
        
        let stockStatus = 'normal';
        if (variant.stock === 0) stockStatus = 'out_of_stock';
        // @ts-ignore
        else if (variant.stock <= threshold) stockStatus = 'low_stock';
        
        return {
          ...variant,
          selling_price: sellingPrice,
          // @ts-ignore
          parent_price: variant.parent ? variant.parent.selling_price : 0,
          stock_status: stockStatus,
          threshold: threshold
        };
      });
      
      return {
        status: true,
        message: `Found ${variantsWithStatus.length} variant(s) with low stock`,
        data: variantsWithStatus,
      };
      
    } catch (error) {
      console.error("Get variants with low stock error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to retrieve low stock variants",
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
        logger.info(`VariantHandler: ${method}`, { 
          method, 
          userId,
          hasParams: !!Object.keys(params).length 
        });
      }

      // Route to appropriate method
      switch (method) {
        // 📦 CRUD OPERATIONS
        case "createVariant":
          return await this.handleWithTransaction(this.createVariant, enrichedParams);
        
        case "updateVariant":
          return await this.handleWithTransaction(this.updateVariant, enrichedParams);
        
        case "deleteVariant":
          return await this.handleWithTransaction(this.deleteVariant, enrichedParams);
        
        case "getVariantById":
          return await this.getVariantById(enrichedParams);
        
        case "bulkCreateVariants":
          // @ts-ignore
          return await this.handleWithTransaction(this.bulkCreateVariants, enrichedParams);

        // 📊 INVENTORY OPERATIONS
        case "updateVariantStock":
          return await this.handleWithTransaction(this.updateVariantStock, enrichedParams);
        
        case "adjustVariantInventory":
          return await this.handleWithTransaction(this.adjustVariantInventory, enrichedParams);
        
        case "syncVariantWithParent":
          return await this.handleWithTransaction(this.syncVariantWithParent, enrichedParams);

        // 🔍 READ-ONLY OPERATIONS
        case "getVariantsByProduct":
          return await this.getVariantsByProduct(enrichedParams);
        
        case "searchVariants":
          return await this.searchVariants(enrichedParams);
        
        case "getVariantByBarcode":
          return await this.getVariantByBarcode(enrichedParams);
        
        case "getVariantBySku":
          return await this.getVariantBySku(enrichedParams);
        
        case "getVariantsWithLowStock":
          return await this.getVariantsWithLowStock(enrichedParams);

        default:
          return {
            status: false,
            message: `Method '${method}' not available in VariantHandler`,
            data: null,
          };
      }
    } catch (error) {
      console.error("VariantHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("VariantHandler error:", error);
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
const variantHandler = new VariantHandler();

ipcMain.handle(
  "variant",
  withErrorHandling(
    // @ts-ignore
    variantHandler.handleRequest.bind(variantHandler),
    "IPC:variant",
  ),
);

module.exports = { VariantHandler, variantHandler };