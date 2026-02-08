// src/ipc/product/create.ipc.js
// @ts-check
const InventoryTransactionLog = require("../../../entities/InventoryTransactionLogs");
// @ts-ignore
const PriceHistory = require("../../../entities/PriceHistory");
const { Product } = require("../../../entities/Product");
const { AppDataSource } = require("../../db/dataSource");

/**
 * Create a new product
 * @param {{
 *   productData: object,
 *   _userId: number,
 *   warehouse_id?: string
 * }} params
 * @param {import("typeorm").QueryRunner} queryRunner
 */
// @ts-ignore
module.exports = async function createProduct(params, queryRunner = null) {
  const { productData, _userId, warehouse_id } = params;
  
  try {
    const productRepo = queryRunner 
      ? queryRunner.manager.getRepository(Product)
      : AppDataSource.getRepository(Product);
    
    const inventoryLogRepo = queryRunner 
      ? queryRunner.manager.getRepository(InventoryTransactionLog)
      : AppDataSource.getRepository(InventoryTransactionLog);
    
    // Validate required fields
    // @ts-ignore
    if (!productData.sku || !productData.name || !productData.selling_price) {
      return {
        status: false,
        message: "SKU, name, and selling price are required",
        data: null,
      };
    }
    
    // Check if SKU already exists
    const existingProduct = await productRepo.findOne({
      // @ts-ignore
      where: { sku: productData.sku, is_deleted: false },
    });
    
    if (existingProduct) {
      return {
        status: false,
        // @ts-ignore
        message: `Product with SKU "${productData.sku}" already exists`,
        data: null,
      };
    }
    
    // Check if barcode already exists (if provided)
    // @ts-ignore
    if (productData.barcode) {
      const existingByBarcode = await productRepo.findOne({
        // @ts-ignore
        where: { barcode: productData.barcode, is_deleted: false },
      });
      
      if (existingByBarcode) {
        return {
          status: false,
          // @ts-ignore
          message: `Product with barcode "${productData.barcode}" already exists`,
          data: null,
        };
      }
    }
    
    // Create new product
    const product = productRepo.create({
      ...productData,
      created_by: _userId,
      // @ts-ignore
      available_stock: productData.stock || 0,
      // @ts-ignore
      stock: productData.stock || 0,
    });
    
    const savedProduct = await productRepo.save(product);
    
    // Log inventory transaction if initial stock is provided
    // @ts-ignore
    if (productData.stock && productData.stock > 0) {
      const inventoryLog = inventoryLogRepo.create({
        // @ts-ignore
        product_id: savedProduct.id.toString(),
        warehouse_id: warehouse_id || null,
        action: 'PRODUCT_CREATED',
        // @ts-ignore
        change_amount: productData.stock,
        quantity_before: 0,
        // @ts-ignore
        quantity_after: productData.stock,
        price_before: null,
        // @ts-ignore
        price_after: productData.selling_price || 0,
        // @ts-ignore
        reference_id: savedProduct.id.toString(),
        reference_type: 'product_creation',
        performed_by_id: _userId ? _userId.toString() : null,
        notes: `Initial stock on product creation`,
      });
      
      await inventoryLogRepo.save(inventoryLog);
    }
    
    // Log activity
    if (_userId) {
      const activityRepo = queryRunner 
        ? queryRunner.manager.getRepository(require("../../../entities/UserActivity"))
        : AppDataSource.getRepository(require("../../../entities/UserActivity"));
      
      await activityRepo.save({
        user_id: _userId,
        action: "product_create",
        entity: "Product",
        entity_id: savedProduct.id,
        description: `Created product: ${savedProduct.name} (SKU: ${savedProduct.sku})`,
      });
    }
    
    return {
      status: true,
      message: "Product created successfully",
      data: savedProduct,
    };
    
  } catch (error) {
    console.error("Create product error:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to create product",
      data: null,
    };
  }
};