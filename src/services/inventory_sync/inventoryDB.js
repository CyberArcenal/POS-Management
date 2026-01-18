// inventoryDB.js - Connector para sa Inventory Management SQLite database
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
   * Kunin ang lahat ng active products mula sa inventory
   */
  async getAllProducts() {
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
        s.name as supplier_name,
        p.is_published as is_active,
        p.track_quantity,
        p.allow_backorder,
        COALESCE(SUM(si.quantity), 0) as total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_supplier ps ON p.id = ps.product_id
      LEFT JOIN suppliers s ON ps.supplier_id = s.id
      LEFT JOIN stock_items si ON p.id = si.product_id AND si.variant_id IS NULL
      WHERE p.is_deleted = 0
      GROUP BY p.id
    `;

    return await this.runQuery(query);
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

          // Log transaction
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
}

module.exports = new InventoryDB();
