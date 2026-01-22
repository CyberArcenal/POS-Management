// inventoryDB.js - FIXED VERSION WITHOUT PRODUCT_SUPPLIER TABLE
//@ts-check
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

class InventoryDB {
  constructor() {
    this.dbPath = null;
    this.db = null;
  }

  /**
   * Resolve inventory database path inside AppData\Roaming
   * without hardcoding username or drive letter.
   */
  async getInventoryDbPath() {
    try {
      // APPDATA environment variable points to Roaming folder on Windows
      const roamingPath = process.env.APPDATA;
      if (!roamingPath) {
        throw new Error("APPDATA environment variable not found");
      }

      // Build DB path relative to Roaming
      const inventoryDbPath = path.join(
        roamingPath,
        "inventory-offline",
        "data",
        "app.db",
      );

      console.log(`Inventory DB path: ${inventoryDbPath}`);

      // Async existence check
      fs.access(inventoryDbPath, fs.constants.F_OK, (err) => {
        if (err) {
          console.error("Database not found:", err);
        } else {
          console.log("Database exists at:", inventoryDbPath);
        }
      });

      return inventoryDbPath;
    } catch (error) {
      console.error("Failed to determine inventory database path:", error);
      throw error;
    }
  }

  async connect() {
    try {
      this.dbPath = await this.getInventoryDbPath();
      this.db = new sqlite3.Database(this.dbPath);
      console.log(`Connected to inventory database: ${this.dbPath}`);
      return this.db;
    } catch (error) {
      console.error("Failed to connect to inventory database:", error);
      throw error;
    }
  }

  async disconnect() {
    if (this.db) {
      this.db.close();
      console.log("Disconnected from inventory database");
    }
  }

  /**
   * Check if inventory database exists and is accessible
   */
  async checkConnection() {
    try {
      await this.connect();
      // @ts-ignore
      // @ts-ignore
      const test = await this.runQuery("SELECT 1 as test");
      await this.disconnect();
      return {
        connected: true,
        message: "Inventory database connected successfully",
      };
    } catch (error) {
      // @ts-ignore
      return {
        connected: false,
        // @ts-ignore
        message: `Failed to connect: ${error.message}`,
      };
    }
  }

  /**
   * Generic query runner
   * @param {string} sql
   */
  // @ts-ignore
  async runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * Kumuha ng table schema para malaman ang mga available na tables
   */
  async getTableSchema() {
    try {
      const tables = await this.runQuery(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
      );

      console.log("Available tables in inventory database:");
      for (const table of tables) {
        const schema = await this.runQuery(`PRAGMA table_info(${table.name})`);
        console.log(`Table: ${table.name}`);
        console.log(
          `Columns: ${schema.map((/** @type {{ name: any; }} */ col) => col.name).join(", ")}`,
        );
      }

      return tables;
    } catch (error) {
      console.error("Failed to get table schema:", error);
      return [];
    }
  }

  /**
   * Kunin ang lahat ng active products mula sa inventory - SIMPLIFIED VERSION
   */
  async getAllProducts() {
    try {
      // Una, i-check natin ang mga available na tables
      await this.getTableSchema();

      // Simple query muna para makuha ang basic product info
      // Tanggalin muna ang LEFT JOIN sa suppliers dahil wala namang product_supplier table
      const query = `
        SELECT 
          p.id as inventory_id,
          p.name,
          p.sku,
          p.net_price as price,
          p.description,
          p.barcode,
          p.cost_per_item as cost_price,
          p.low_stock_threshold as min_stock,
          c.name as category_name,
          NULL as supplier_name, -- Wala pang supplier info
          p.is_published as is_active,
          p.track_quantity,
          p.allow_backorder,
          COALESCE(SUM(si.quantity), 0) as total_stock
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN stock_items si ON p.id = si.product_id AND si.variant_id IS NULL
        WHERE p.is_deleted = 0
        GROUP BY p.id
        ORDER BY p.name
      `;

      console.log("Executing getAllProducts query...");
      const products = await this.runQuery(query);
      console.log(`Retrieved ${products.length} products from inventory`);

      return products;
    } catch (error) {
      console.error("Error in getAllProducts:", error);

      // Fallback: Try simpler query if the above fails
      try {
        console.log("Trying fallback query...");
        const fallbackQuery = `
          SELECT 
            p.id as inventory_id,
            p.name,
            p.sku,
            p.net_price as price,
            p.description,
            p.barcode,
            p.cost_per_item as cost_price,
            p.low_stock_threshold as min_stock,
            p.is_published as is_active,
            COALESCE(SUM(si.quantity), 0) as total_stock
          FROM products p
          LEFT JOIN stock_items si ON p.id = si.product_id
          WHERE p.is_deleted = 0
          GROUP BY p.id
        `;

        const fallbackProducts = await this.runQuery(fallbackQuery);
        console.log(
          `Retrieved ${fallbackProducts.length} products with fallback query`,
        );

        // Add missing fields
        return fallbackProducts.map((/** @type {any} */ product) => ({
          ...product,
          category_name: null,
          supplier_name: null,
          track_quantity: 1,
          allow_backorder: 0,
        }));
      } catch (fallbackError) {
        console.error("Fallback query also failed:", fallbackError);
        throw error;
      }
    }
  }

  /**
   * Alternative: Get products with supplier info through purchases
   * Kung gusto mo talaga ng supplier info
   */
  async getAllProductsWithSuppliers() {
    try {
      // Check if purchases and suppliers tables exist
      const tables = await this.runQuery(
        "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('purchases', 'purchase_items', 'suppliers')",
      );

      const hasPurchases = tables.some(
        (/** @type {{ name: string; }} */ t) => t.name === "purchases",
      );
      const hasPurchaseItems = tables.some(
        (/** @type {{ name: string; }} */ t) => t.name === "purchase_items",
      );
      const hasSuppliers = tables.some(
        (/** @type {{ name: string; }} */ t) => t.name === "suppliers",
      );

      // @ts-ignore
      let supplierJoin = "";
      let supplierSelect = "NULL as supplier_name,";

      if (hasPurchases && hasPurchaseItems && hasSuppliers) {
        // Kung complete ang tables, subukan nating kunin ang supplier
        supplierSelect = `
          (
            SELECT s.name 
            FROM suppliers s 
            WHERE s.id = (
              SELECT pu.supplier_id 
              FROM purchases pu 
              JOIN purchase_items pi ON pu.id = pi.purchase_id 
              WHERE pi.product_id = p.id 
              ORDER BY pu.created_at DESC 
              LIMIT 1
            )
          ) as supplier_name,
        `;
      }

      const query = `
        SELECT 
          p.id as inventory_id,
          p.name,
          p.sku,
          p.net_price as price,
          p.description,
          p.barcode,
          p.cost_per_item as cost_price,
          p.low_stock_threshold as min_stock,
          c.name as category_name,
          ${supplierSelect}
          p.is_published as is_active,
          p.track_quantity,
          p.allow_backorder,
          COALESCE(SUM(si.quantity), 0) as total_stock
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN stock_items si ON p.id = si.product_id AND si.variant_id IS NULL
        WHERE p.is_deleted = 0
        GROUP BY p.id
        ORDER BY p.name
      `;

      return await this.runQuery(query);
    } catch (error) {
      console.error("Error in getAllProductsWithSuppliers:", error);
      // Fallback to simple query
      return await this.getAllProducts();
    }
  }

  /**
   * Kunin ang total stock ng product mula sa inventory
   * @param {any} inventoryId
   */
  async getProductStock(inventoryId) {
    const query = `
      SELECT SUM(quantity) as total_stock
      FROM stock_items 
      WHERE product_id = ? AND is_deleted = 0
    `;

    const result = await this.runQuery(query, [inventoryId]);
    return result[0] ? result[0].total_stock || 0 : 0;
  }

  /**
   * I-update ang stock sa inventory pag may sale sa POS
   * @param {any} inventoryId
   * @param {number} quantityChange
   */
  async updateProductStock(
    inventoryId,
    quantityChange,
    action = "sale",
    userId = "pos_system",
  ) {
    try {
      await this.runQuery("BEGIN TRANSACTION");

      // Hanapin ang stock item (kunin ang unang warehouse)
      const stockItemQuery = `
        SELECT id, quantity, warehouse_id 
        FROM stock_items 
        WHERE product_id = ? AND is_deleted = 0 
        LIMIT 1
      `;

      const stockItems = await this.runQuery(stockItemQuery, [inventoryId]);

      if (stockItems.length > 0) {
        const stockItem = stockItems[0];
        const newQuantity = stockItem.quantity + quantityChange;

        if (newQuantity < 0) {
          throw new Error(
            `Insufficient stock. Available: ${stockItem.quantity}, Trying to reduce: ${Math.abs(quantityChange)}`,
          );
        }

        // Update stock
        const updateQuery = `
          UPDATE stock_items 
          SET quantity = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `;

        await this.runQuery(updateQuery, [newQuantity, stockItem.id]);

        // Check if inventory_transaction_logs table exists
        try {
          // Log transaction
          const logQuery = `
            INSERT INTO inventory_transaction_logs (
              product_id, action, change_amount, 
              quantity_before, quantity_after,
              performed_by_id, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `;

          const notes =
            action === "sale"
              ? `POS Sale - Reduced by ${Math.abs(quantityChange)}`
              : `POS Return - Added ${quantityChange}`;

          await this.runQuery(logQuery, [
            inventoryId,
            action,
            quantityChange,
            stockItem.quantity,
            newQuantity,
            userId,
            notes,
          ]);
        } catch (logError) {
          // @ts-ignore
          console.warn(
            "Could not log transaction (table might not exist):",
            // @ts-ignore
            logError.message,
          );
          // Continue even if logging fails
        }

        await this.runQuery("COMMIT");

        return {
          success: true,
          newStock: newQuantity,
          previousStock: stockItem.quantity,
          warehouseId: stockItem.warehouse_id,
        };
      } else {
        // Kung wala pang stock item, create one (for returns)
        if (quantityChange > 0) {
          // Get default warehouse
          const warehouseQuery = `SELECT id FROM warehouses WHERE is_active = 1 AND is_deleted = 0 LIMIT 1`;
          const warehouses = await this.runQuery(warehouseQuery);

          if (warehouses.length === 0) {
            throw new Error("No active warehouse found in inventory system");
          }

          const warehouseId = warehouses[0].id;

          // Create new stock item
          const insertQuery = `
            INSERT INTO stock_items (
              product_id, warehouse_id, quantity, 
              created_at, updated_at
            ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `;

          await this.runQuery(insertQuery, [
            inventoryId,
            warehouseId,
            quantityChange,
          ]);

          // Try to log transaction
          try {
            const logQuery = `
              INSERT INTO inventory_transaction_logs (
                product_id, action, change_amount, 
                quantity_before, quantity_after,
                performed_by_id, notes, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `;

            await this.runQuery(logQuery, [
              inventoryId,
              "manual_adjustment",
              quantityChange,
              0,
              quantityChange,
              userId,
              "Initial stock from POS return",
            ]);
          } catch (logError) {
            // @ts-ignore
            console.warn("Could not log transaction:", logError.message);
          }

          await this.runQuery("COMMIT");

          return {
            success: true,
            newStock: quantityChange,
            previousStock: 0,
            warehouseId: warehouseId,
          };
        } else {
          throw new Error(
            "Cannot reduce stock: Product has no stock record in inventory",
          );
        }
      }
    } catch (error) {
      await this.runQuery("ROLLBACK");
      throw error;
    }
  }

  /**
   * Bulk update ng stock para sa multiple products
   * @param {{ inventoryId: number; quantityChange: number; action: string; productName: any; saleId: any; itemId: any; }[]} updates
   */
  async bulkUpdateStock(updates, userId = "pos_system") {
    const results = [];

    for (const update of updates) {
      try {
        const result = await this.updateProductStock(
          update.inventoryId,
          update.quantityChange,
          update.action,
          userId,
        );
        // @ts-ignore
        results.push({ ...update, success: true, ...result });
      } catch (error) {
        results.push({
          ...update,
          success: false,
          // @ts-ignore
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Get product variants from inventory
   * @param {any} productId
   */
  async getProductVariants(productId) {
    const query = `
      SELECT 
        pv.id as variant_id,
        pv.name,
        pv.sku,
        pv.net_price as price,
        pv.barcode,
        pv.cost_per_item as cost_price,
        COALESCE(SUM(si.quantity), 0) as total_stock
      FROM product_variants pv
      LEFT JOIN stock_items si ON pv.id = si.variant_id AND si.is_deleted = 0
      WHERE pv.product_id = ? AND pv.is_deleted = 0
      GROUP BY pv.id
    `;

    return await this.runQuery(query, [productId]);
  }

  /**
   * Get all warehouses from inventory
   */
  async getWarehouses() {
    const query = `
      SELECT id, name, type, location, is_active
      FROM warehouses 
      WHERE is_deleted = 0
      ORDER BY name
    `;

    return await this.runQuery(query);
  }

  /**
   * Check if specific table exists
   * @param {string} tableName
   */
  async tableExists(tableName) {
    try {
      const result = await this.runQuery(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
        [tableName],
      );
      return result.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Detect and return the correct query based on available tables
   */
  async detectDatabaseSchema() {
    try {
      const tables = await this.runQuery(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
      );

      const tableNames = tables.map(
        (/** @type {{ name: any; }} */ t) => t.name,
      );
      console.log("Available tables:", tableNames);

      // Check for specific tables
      const hasProductSupplier = tableNames.includes("product_supplier");
      const hasSuppliers = tableNames.includes("suppliers");
      const hasPurchases = tableNames.includes("purchases");
      const hasPurchaseItems = tableNames.includes("purchase_items");

      return {
        hasProductSupplier,
        hasSuppliers,
        hasPurchases,
        hasPurchaseItems,
        tableNames,
      };
    } catch (error) {
      console.error("Failed to detect database schema:", error);
      return {
        hasProductSupplier: false,
        hasSuppliers: false,
        hasPurchases: false,
        hasPurchaseItems: false,
        tableNames: [],
      };
    }
  }

  // inventoryDB.js - INVENTORY SIDE (RAW SQLite)
  // Add these methods to your existing inventoryDB class:

  /**
   * Get warehouse by ID
   * @param {any} warehouseId
   */
  async getWarehouseById(warehouseId) {
    const query = `
    SELECT id, name, type, location, is_active
    FROM warehouses 
    WHERE id = ? AND is_deleted = 0
  `;

    const result = await this.runQuery(query, [warehouseId]);
    return result[0] || null;
  }

  /**
   * Get products and variants for specific warehouse
   * @param {any} warehouseId
   */
  async getProductsByWarehouse(warehouseId) {
    try {
      // Check if variants table exists
      const hasVariants = await this.tableExists("product_variants");

      if (!hasVariants) {
        // Only products
        const productQuery = `
        SELECT 
          p.id as inventory_id,
          p.name,
          p.sku,
          p.net_price as price,
          p.description,
          p.barcode,
          p.cost_per_item as cost_price,
          p.low_stock_threshold as min_stock,
          c.name as category_name,
          p.is_published as is_active,
          p.track_quantity,
          p.allow_backorder,
          COALESCE(si.quantity, 0) as warehouse_stock,
          'product' as item_type,
          NULL as variant_name,
          NULL as parent_product_id
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN stock_items si ON p.id = si.product_id 
          AND si.variant_id IS NULL 
          AND si.warehouse_id = ?
        WHERE p.is_deleted = 0
          AND (si.warehouse_id IS NOT NULL OR p.is_published = 1)
        ORDER BY p.name
      `;

        return await this.runQuery(productQuery, [warehouseId]);
      }

      // Get products for warehouse
      const productQuery = `
      SELECT 
        p.id as inventory_id,
        p.name,
        p.sku,
        p.net_price as price,
        p.description,
        p.barcode,
        p.cost_per_item as cost_price,
        p.low_stock_threshold as min_stock,
        c.name as category_name,
        p.is_published as is_active,
        p.track_quantity,
        p.allow_backorder,
        COALESCE(si.quantity, 0) as warehouse_stock,
        'product' as item_type,
        NULL as variant_name,
        NULL as parent_product_id
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN stock_items si ON p.id = si.product_id 
        AND si.variant_id IS NULL 
        AND si.warehouse_id = ?
      WHERE p.is_deleted = 0
        AND (si.warehouse_id IS NOT NULL OR p.is_published = 1)
    `;

      // Get variants for warehouse
      const variantQuery = `
      SELECT 
        pv.id as inventory_id,
        CONCAT(p.name, ' - ', pv.name) as name,
        pv.sku,
        pv.net_price as price,
        p.description,
        pv.barcode,
        pv.cost_per_item as cost_price,
        pv.low_stock_threshold as min_stock,
        c.name as category_name,
        p.is_published as is_active,
        p.track_quantity,
        p.allow_backorder,
        COALESCE(si.quantity, 0) as warehouse_stock,
        'variant' as item_type,
        pv.name as variant_name,
        p.id as parent_product_id
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN stock_items si ON pv.id = si.variant_id 
        AND si.warehouse_id = ?
      WHERE pv.is_deleted = 0
        AND p.is_deleted = 0
        AND (si.warehouse_id IS NOT NULL OR p.is_published = 1)
    `;

      const products = await this.runQuery(productQuery, [warehouseId]);
      const variants = await this.runQuery(variantQuery, [warehouseId]);

      return [...products, ...variants];
    } catch (error) {
      console.error("Error in getProductsByWarehouse:", error);
      throw error;
    }
  }

  /**
   * Update variant stock in inventory
   * @param {any} variantId
   * @param {number} warehouseId
   * @param {any} quantityChange
   */
  async updateVariantStock(
    variantId,
    warehouseId,
    quantityChange,
    action = "sale",
    userId = "pos_system",
  ) {
    return await this.updateStock(
      "variant",
      variantId,
      warehouseId,
      quantityChange,
      action,
      userId,
    );
  }

  /**
   * Generic stock update method
   * @param {string} itemType
   * @param {any} itemId
   * @param {any} warehouseId
   * @param {number} quantityChange
   * @param {string} action
   * @param {string} userId
   */
  async updateStock(
    itemType,
    itemId,
    warehouseId,
    quantityChange,
    action,
    userId,
  ) {
    try {
      await this.runQuery("BEGIN TRANSACTION");

      // Determine stock item query based on item type
      let stockItemQuery;
      if (itemType === "variant") {
        stockItemQuery = `
        SELECT id, quantity 
        FROM stock_items 
        WHERE variant_id = ? AND warehouse_id = ? AND is_deleted = 0
      `;
      } else {
        stockItemQuery = `
        SELECT id, quantity 
        FROM stock_items 
        WHERE product_id = ? AND warehouse_id = ? AND is_deleted = 0
      `;
      }

      const stockItems = await this.runQuery(stockItemQuery, [
        itemId,
        warehouseId,
      ]);

      if (stockItems.length === 0) {
        // Create stock item if it doesn't exist (for returns/positive changes)
        if (quantityChange <= 0) {
          throw new Error(
            `Cannot reduce stock: No stock record found for ${itemType} ${itemId} in warehouse ${warehouseId}`,
          );
        }

        // Create new stock item
        let insertQuery;
        if (itemType === "variant") {
          insertQuery = `
          INSERT INTO stock_items (variant_id, warehouse_id, quantity, created_at, updated_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;
        } else {
          insertQuery = `
          INSERT INTO stock_items (product_id, warehouse_id, quantity, created_at, updated_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;
        }

        await this.runQuery(insertQuery, [itemId, warehouseId, quantityChange]);

        // Log transaction
        await this.logInventoryTransaction(
          itemId,
          null, // variant id
          action,
          quantityChange,
          0,
          quantityChange,
          userId,
          warehouseId,
          `Initial stock from POS ${action}`,
        );

        await this.runQuery("COMMIT");

        return {
          success: true,
          transactionId: Date.now().toString(),
          newStock: quantityChange,
          previousStock: 0,
          warehouseId,
        };
      }

      // Update existing stock item
      const stockItem = stockItems[0];
      const newQuantity = stockItem.quantity + quantityChange;

      if (newQuantity < 0) {
        throw new Error(
          `Insufficient stock. Available: ${stockItem.quantity}, Trying to adjust: ${quantityChange}`,
        );
      }

      // Update stock
      const updateQuery = `
      UPDATE stock_items 
      SET quantity = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

      await this.runQuery(updateQuery, [newQuantity, stockItem.id]);

      // Log transaction
      await this.logInventoryTransaction(
        itemType === "product" ? itemId : null,
        itemType === "variant" ? itemId : null,
        action,
        quantityChange,
        stockItem.quantity,
        newQuantity,
        userId,
        warehouseId,
        `POS ${action}: ${quantityChange > 0 ? "+" : ""}${quantityChange} units`,
      );

      await this.runQuery("COMMIT");

      return {
        success: true,
        transactionId: Date.now().toString(),
        newStock: newQuantity,
        previousStock: stockItem.quantity,
        warehouseId,
      };
    } catch (error) {
      await this.runQuery("ROLLBACK");
      throw error;
    }
  }

  /**
   * Get warehouse stock summary
   * @param {any} warehouseId
   */
  async getWarehouseStockSummary(warehouseId) {
    try {
      const hasVariants = await this.tableExists("product_variants");

      if (!hasVariants) {
        const query = `
        SELECT 
          p.id as item_id,
          p.name as item_name,
          p.sku,
          p.barcode,
          si.quantity as current_stock,
          si.reorder_level,
          'product' as item_type,
          si.product_id,
          NULL as variant_id,
          si.updated_at as last_updated
        FROM stock_items si
        JOIN products p ON si.product_id = p.id
        WHERE si.warehouse_id = ?
          AND si.is_deleted = 0
          AND p.is_deleted = 0
          AND si.variant_id IS NULL
        ORDER BY item_name
      `;

        return await this.runQuery(query, [warehouseId]);
      }

      const query = `
      SELECT 
        COALESCE(p.id, pv.id) as item_id,
        COALESCE(p.name, CONCAT(pp.name, ' - ', pv.name)) as item_name,
        COALESCE(p.sku, pv.sku) as sku,
        COALESCE(p.barcode, pv.barcode) as barcode,
        si.quantity as current_stock,
        si.reorder_level,
        CASE 
          WHEN si.variant_id IS NULL THEN 'product'
          ELSE 'variant'
        END as item_type,
        si.product_id,
        si.variant_id,
        si.updated_at as last_updated
      FROM stock_items si
      LEFT JOIN products p ON si.product_id = p.id AND si.variant_id IS NULL
      LEFT JOIN product_variants pv ON si.variant_id = pv.id
      LEFT JOIN products pp ON pv.product_id = pp.id
      WHERE si.warehouse_id = ?
        AND si.is_deleted = 0
        AND (p.is_deleted = 0 OR pp.is_deleted = 0)
      ORDER BY item_name
    `;

      return await this.runQuery(query, [warehouseId]);
    } catch (error) {
      console.error("Error in getWarehouseStockSummary:", error);
      return [];
    }
  }

  /**
   * Get stock changes since last sync
   * @param {any} warehouseId
   * @param {any} lastSyncTime
   */
  async getStockChangesSince(warehouseId, lastSyncTime) {
    const query = `
    SELECT 
      sm.id,
      sm.stock_item_id,
      sm.warehouse_id,
      sm.change,
      sm.movement_type,
      sm.reference_code,
      sm.reason,
      sm.created_at,
      sm.created_by_id,
      sm.metadata,
      COALESCE(p.id, pv.id) as product_variant_id,
      COALESCE(p.name, CONCAT(pp.name, ' - ', pv.name)) as product_name,
      CASE 
        WHEN sm.stock_item_id LIKE 'variant_%' THEN 'variant'
        ELSE 'product'
      END as item_type
    FROM stock_movements sm
    LEFT JOIN stock_items si ON sm.stock_item_id = si.id
    LEFT JOIN products p ON si.product_id = p.id AND si.variant_id IS NULL
    LEFT JOIN product_variants pv ON si.variant_id = pv.id
    LEFT JOIN products pp ON pv.product_id = pp.id
    WHERE sm.warehouse_id = ?
      AND sm.created_at > ?
      AND sm.is_deleted = 0
    ORDER BY sm.created_at ASC
  `;

    return await this.runQuery(query, [warehouseId, lastSyncTime]);
  }

  /**
   * Helper: Log inventory transaction
   * @param {any} productId
   * @param {null} variantId
   * @param {any} action
   * @param {any} changeAmount
   * @param {number} quantityBefore
   * @param {any} quantityAfter
   * @param {any} performedById
   * @param {any} warehouseId
   * @param {string} notes
   */
  async logInventoryTransaction(
    productId,
    variantId,
    action,
    changeAmount,
    quantityBefore,
    quantityAfter,
    performedById,
    warehouseId,
    notes,
  ) {
    try {
      const logQuery = `
      INSERT INTO inventory_transaction_logs (
        product_id, variant_id, action, change_amount,
        quantity_before, quantity_after, performed_by_id,
        warehouse_id, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

      await this.runQuery(logQuery, [
        productId,
        variantId,
        action,
        changeAmount,
        quantityBefore,
        quantityAfter,
        performedById,
        warehouseId,
        notes,
      ]);

      return Date.now().toString(); // Return transaction ID
    } catch (error) {
      console.warn("Failed to log inventory transaction:", error);
      return null;
    }
  }
}

module.exports = new InventoryDB();
