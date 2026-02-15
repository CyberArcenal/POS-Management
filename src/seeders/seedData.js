// seedData.js
// POS Management System Seeder
// Run with: npm run seed [options]

const { DataSource } = require("typeorm");
const { AppDataSource } = require("../main/db/datasource");
const Customer = require("../entities/Customer");
const Product = require("../entities/Product");
const Sale = require("../entities/Sale");
const SaleItem = require("../entities/SaleItem");
const InventoryMovement = require("../entities/InventoryMovement");
const LoyaltyTransaction = require("../entities/LoyaltyTransaction");
const { AuditLog } = require("../entities/AuditLog");
const { SystemSetting } = require("../entities/systemSettings");

// ========== CONFIGURATION ==========
const DEFAULT_CONFIG = {
  productCount: 50,
  customerCount: 30,
  saleCount: 100,
  inventoryMovementCount: 150,
  loyaltyTransactionCount: 80,
  auditLogCount: 60,
  clearOnly: false,
  skipProducts: false,
  skipCustomers: false,
  skipSales: false,
  skipInventoryMovements: false,
  skipLoyaltyTransactions: false,
  skipAuditLogs: false,
  skipSystemSettings: false,
};

// ========== RANDOM HELPERS ==========
const random = {
  int: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  float: (min, max, decimals = 2) => +(Math.random() * (max - min) + min).toFixed(decimals),
  date: (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())),
  pastDate: () => random.date(new Date(2024, 0, 1), new Date()),
  futureDate: () => random.date(new Date(), new Date(2026, 11, 31)),
  element: (arr) => arr[Math.floor(Math.random() * arr.length)],
  boolean: (probability = 0.5) => Math.random() < probability,
  sku: (usedSet) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let sku;
    do {
      sku = Array.from({ length: 8 }, () => chars[random.int(0, chars.length - 1)]).join('');
    } while (usedSet.has(sku));
    usedSet.add(sku);
    return sku;
  },
  phone: () => `+63${random.int(900000000, 999999999)}`,
  name: () => {
    const first = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Maria', 'James', 'Patricia', 'Robert', 'Jennifer'];
    const last = ['Smith', 'Doe', 'Johnson', 'Brown', 'Davis', 'Garcia', 'Rodriguez', 'Wilson', 'Martinez', 'Taylor'];
    return `${random.element(first)} ${random.element(last)}`;
  },
  productName: () => {
    const adjectives = ['Premium', 'Deluxe', 'Basic', 'Pro', 'Lite', 'Eco', 'Smart', 'Classic'];
    const nouns = ['Widget', 'Gadget', 'Tool', 'Device', 'Appliance', 'Component', 'Accessory', 'Supply'];
    return `${random.element(adjectives)} ${random.element(nouns)}`;
  },
  description: () => random.boolean(0.3) ? `High quality ${random.productName().toLowerCase()} for everyday use.` : null,
};

// ========== SEEDER CLASS ==========
class POSSeeder {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.dataSource = null;
    this.queryRunner = null;
    this.usedSkus = new Set();
    this.productPriceCache = new Map(); // product id -> price
  }

  async init() {
    console.log('⏳ Initializing database connection...');
    this.dataSource = await AppDataSource.initialize();
    this.queryRunner = this.dataSource.createQueryRunner();
    console.log('✅ Database connected');
  }

  async destroy() {
    if (this.queryRunner) await this.queryRunner.release();
    if (this.dataSource) await this.dataSource.destroy();
    console.log('🔒 Connection closed');
  }

  async clearData() {
    console.log('🧹 Clearing old data...');
    await this.queryRunner.query('PRAGMA foreign_keys = OFF;');
    try {
      // Order matters to avoid FK constraints
      await this.queryRunner.clearTable('sale_items');
      await this.queryRunner.clearTable('inventory_movements');
      await this.queryRunner.clearTable('loyalty_transactions');
      await this.queryRunner.clearTable('sales');
      await this.queryRunner.clearTable('customers');
      await this.queryRunner.clearTable('products');
      await this.queryRunner.clearTable('audit_logs');
      await this.queryRunner.clearTable('system_settings');
    } finally {
      await this.queryRunner.query('PRAGMA foreign_keys = ON;');
    }
    console.log('✅ All tables cleared');
  }

  async seedProducts() {
    console.log(`📦 Seeding ${this.config.productCount} products...`);
    const products = [];

    for (let i = 0; i < this.config.productCount; i++) {
      const price = random.float(10, 500);
      const stockQty = random.int(0, 100);
      products.push({
        sku: random.sku(this.usedSkus),
        name: random.productName(),
        description: random.description(),
        price: price,
        stockQty: stockQty,
        isActive: random.boolean(0.9),
        createdAt: random.pastDate(),
        updatedAt: random.boolean(0.3) ? random.pastDate() : null,
      });
    }

    const repo = this.dataSource.getRepository(Product);
    const saved = await repo.save(products);
    // Cache prices for later use
    saved.forEach(p => this.productPriceCache.set(p.id, parseFloat(p.price)));
    console.log(`✅ ${saved.length} products saved`);
    return saved;
  }

  async seedCustomers() {
    console.log(`👥 Seeding ${this.config.customerCount} customers...`);
    const customers = [];

    for (let i = 0; i < this.config.customerCount; i++) {
      customers.push({
        name: random.name(),
        contactInfo: random.boolean(0.7) ? random.phone() : null,
        loyaltyPointsBalance: random.int(0, 500),
        createdAt: random.pastDate(),
        updatedAt: random.boolean(0.2) ? random.pastDate() : null,
      });
    }

    const repo = this.dataSource.getRepository(Customer);
    const saved = await repo.save(customers);
    console.log(`✅ ${saved.length} customers saved`);
    return saved;
  }

  async seedSales(products, customers) {
    console.log(`🧾 Seeding ${this.config.saleCount} sales with items...`);
    const saleRepo = this.dataSource.getRepository(Sale);
    const saleItemRepo = this.dataSource.getRepository(SaleItem);

    const statuses = ['initiated', 'paid', 'refunded', 'voided'];
    const paymentMethods = ['cash', 'card', 'wallet'];

    const sales = [];
    const saleItems = [];

    for (let i = 0; i < this.config.saleCount; i++) {
      const customer = random.boolean(0.6) ? random.element(customers) : null;
      const status = random.element(statuses);
      // For past sales, make them mostly paid or refunded
      const isPast = random.boolean(0.7);
      const saleDate = isPast ? random.pastDate() : random.futureDate();
      const paymentMethod = random.element(paymentMethods);

      // Determine number of items (1-5)
      const itemCount = random.int(1, 5);
      let totalAmount = 0;
      const sale = {
        timestamp: saleDate,
        status: status,
        paymentMethod: paymentMethod,
        totalAmount: 0, // will update after items
        notes: random.boolean(0.2) ? 'Sample note' : null,
        createdAt: saleDate,
        updatedAt: random.boolean(0.1) ? random.pastDate() : null,
        customer: customer ? { id: customer.id } : null,
      };

      // Save sale first to get ID
      const savedSale = await saleRepo.save(sale);
      sales.push(savedSale);

      // Create items
      for (let j = 0; j < itemCount; j++) {
        const product = random.element(products);
        const quantity = random.int(1, 5);
        const unitPrice = this.productPriceCache.get(product.id) || random.float(10, 500);
        const discount = random.boolean(0.3) ? random.float(0, unitPrice * 0.2) : 0;
        const tax = random.boolean(0.5) ? random.float(0, unitPrice * 0.12) : 0;
        const lineTotal = quantity * unitPrice - discount + tax;
        totalAmount += lineTotal;

        saleItems.push({
          quantity: quantity,
          unitPrice: unitPrice,
          discount: discount,
          tax: tax,
          lineTotal: lineTotal,
          createdAt: savedSale.createdAt,
          updatedAt: random.boolean(0.1) ? random.pastDate() : null,
          sale: { id: savedSale.id },
          product: { id: product.id },
        });
      }

      // Update sale totalAmount
      savedSale.totalAmount = totalAmount;
      await saleRepo.save(savedSale);
    }

    // Bulk insert sale items
    const savedItems = await saleItemRepo.save(saleItems);
    console.log(`✅ ${sales.length} sales with ${savedItems.length} items saved`);
    return { sales, saleItems: savedItems };
  }

  async seedInventoryMovements(products, sales, saleItems) {
    console.log(`📦 Seeding ${this.config.inventoryMovementCount} inventory movements...`);
    const movementRepo = this.dataSource.getRepository(InventoryMovement);
    const movementTypes = ['sale', 'refund', 'adjustment'];
    const movements = [];

    // Create movements from sale items (sale type)
    for (const item of saleItems) {
      if (random.boolean(0.8)) { // 80% of sale items generate movement
        movements.push({
          movementType: 'sale',
          qtyChange: -item.quantity,
          timestamp: item.createdAt,
          notes: `Sale #${item.sale.id} item`,
          updatedAt: random.boolean(0.1) ? random.pastDate() : null,
          product: { id: item.product.id },
          sale: { id: item.sale.id },
        });
      }
    }

    // Additional random movements
    while (movements.length < this.config.inventoryMovementCount) {
      const product = random.element(products);
      const sale = random.boolean(0.3) ? random.element(sales) : null;
      const movementType = random.element(movementTypes);
      let qtyChange;
      if (movementType === 'sale') qtyChange = -random.int(1, 10);
      else if (movementType === 'refund') qtyChange = random.int(1, 5);
      else qtyChange = random.int(-20, 20); // adjustment

      movements.push({
        movementType: movementType,
        qtyChange: qtyChange,
        timestamp: random.pastDate(),
        notes: random.boolean(0.2) ? 'Manual adjustment' : null,
        updatedAt: random.boolean(0.1) ? random.pastDate() : null,
        product: { id: product.id },
        sale: sale ? { id: sale.id } : null,
      });
    }

    // Trim if exceeded
    if (movements.length > this.config.inventoryMovementCount) {
      movements.length = this.config.inventoryMovementCount;
    }

    const saved = await movementRepo.save(movements);
    console.log(`✅ ${saved.length} inventory movements saved`);
    return saved;
  }

  async seedLoyaltyTransactions(customers, sales) {
    console.log(`💳 Seeding ${this.config.loyaltyTransactionCount} loyalty transactions...`);
    const transactionRepo = this.dataSource.getRepository(LoyaltyTransaction);
    const transactions = [];

    for (let i = 0; i < this.config.loyaltyTransactionCount; i++) {
      const customer = random.element(customers);
      const sale = random.boolean(0.4) ? random.element(sales) : null;
      const pointsChange = random.boolean(0.7) ? random.int(10, 200) : -random.int(5, 50);
      const timestamp = sale ? sale.timestamp : random.pastDate();

      transactions.push({
        pointsChange: pointsChange,
        timestamp: timestamp,
        notes: pointsChange > 0 ? 'Earned from purchase' : 'Redeemed reward',
        updatedAt: random.boolean(0.1) ? random.pastDate() : null,
        customer: { id: customer.id },
        sale: sale ? { id: sale.id } : null,
      });
    }

    const saved = await transactionRepo.save(transactions);
    console.log(`✅ ${saved.length} loyalty transactions saved`);
    return saved;
  }

  async seedAuditLogs() {
    console.log(`📝 Seeding ${this.config.auditLogCount} audit logs...`);
    const actions = ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT'];
    const entities = ['Product', 'Customer', 'Sale', 'InventoryMovement', 'LoyaltyTransaction', 'SystemSetting'];

    const logs = [];
    for (let i = 0; i < this.config.auditLogCount; i++) {
      logs.push({
        action: random.element(actions),
        entity: random.element(entities),
        entityId: random.int(1, 100),
        timestamp: random.pastDate(),
        user: random.element(['admin', 'cashier1', 'manager', 'system']),
      });
    }

    const repo = this.dataSource.getRepository(AuditLog);
    await repo.save(logs);
    console.log(`✅ ${this.config.auditLogCount} audit logs saved`);
  }

  async seedSystemSettings() {
    console.log('⚙️ Seeding system settings...');
    const settings = [
      { key: 'store_name', value: 'CyberArcenal POS', setting_type: 'general', description: 'Store display name', is_public: true },
      { key: 'currency', value: 'PHP', setting_type: 'general', description: 'Currency used for pricing', is_public: true },
      { key: 'tax_rate', value: '12', setting_type: 'general', description: 'VAT percentage', is_public: false },
      { key: 'loyalty_points_per_currency', value: '1', setting_type: 'general', description: 'Points earned per unit currency', is_public: false },
      { key: 'enable_inventory_sync', value: 'true', setting_type: 'general', description: 'Enable external inventory sync', is_public: false },
      { key: 'default_payment_method', value: 'cash', setting_type: 'general', description: 'Default payment method', is_public: true },
      { key: 'receipt_footer', value: 'Thank you for shopping!', setting_type: 'general', description: 'Receipt footer message', is_public: true },
    ];

    const repo = this.dataSource.getRepository(SystemSetting);
    await repo.save(settings);
    console.log(`✅ ${settings.length} system settings saved`);
    return settings;
  }

  async run() {
    try {
      await this.init();
      await this.queryRunner.startTransaction();

      if (!this.config.clearOnly) {
        await this.clearData();
      }

      if (this.config.clearOnly) {
        console.log('🧹 Clear only mode – no seeding performed.');
        await this.queryRunner.commitTransaction();
        return;
      }

      let products = [];
      let customers = [];
      let sales = [], saleItems = [];

      if (!this.config.skipProducts) products = await this.seedProducts();
      if (!this.config.skipCustomers) customers = await this.seedCustomers();

      if (!this.config.skipSales && products.length && customers.length) {
        const result = await this.seedSales(products, customers);
        sales = result.sales;
        saleItems = result.saleItems;
      }

      if (!this.config.skipInventoryMovements && products.length) {
        await this.seedInventoryMovements(products, sales, saleItems);
      }

      if (!this.config.skipLoyaltyTransactions && customers.length) {
        await this.seedLoyaltyTransactions(customers, sales);
      }

      if (!this.config.skipAuditLogs) {
        await this.seedAuditLogs();
      }

      if (!this.config.skipSystemSettings) {
        await this.seedSystemSettings();
      }

      await this.queryRunner.commitTransaction();

      console.log('\n🎉 SEED COMPLETED SUCCESSFULLY!');
      console.log(`   Products: ${products.length}`);
      console.log(`   Customers: ${customers.length}`);
      console.log(`   Sales: ${sales.length}`);
      console.log(`   Sale Items: ${saleItems.length}`);
      console.log(`   Inventory Movements: ${Math.min(this.config.inventoryMovementCount, saleItems.length + (this.config.inventoryMovementCount - saleItems.length))}`);
      console.log(`   Loyalty Transactions: ${this.config.loyaltyTransactionCount}`);
      console.log(`   Audit Logs: ${this.config.auditLogCount}`);
      console.log(`   System Settings: 7`);

    } catch (error) {
      console.error('\n❌ Seeding failed – rolling back...', error);
      if (this.queryRunner) await this.queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await this.destroy();
    }
  }
}

// ========== COMMAND LINE HANDLER ==========
function parseArgs() {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--clear-only':
        config.clearOnly = true;
        break;
      case '--products':
        config.skipProducts = false;
        config.productCount = parseInt(args[++i]) || DEFAULT_CONFIG.productCount;
        break;
      case '--customers':
        config.skipCustomers = false;
        config.customerCount = parseInt(args[++i]) || DEFAULT_CONFIG.customerCount;
        break;
      case '--sales':
        config.skipSales = false;
        config.saleCount = parseInt(args[++i]) || DEFAULT_CONFIG.saleCount;
        break;
      case '--inventory-movements':
        config.skipInventoryMovements = false;
        config.inventoryMovementCount = parseInt(args[++i]) || DEFAULT_CONFIG.inventoryMovementCount;
        break;
      case '--loyalty-transactions':
        config.skipLoyaltyTransactions = false;
        config.loyaltyTransactionCount = parseInt(args[++i]) || DEFAULT_CONFIG.loyaltyTransactionCount;
        break;
      case '--audit-logs':
        config.skipAuditLogs = false;
        config.auditLogCount = parseInt(args[++i]) || DEFAULT_CONFIG.auditLogCount;
        break;
      case '--skip-products':
        config.skipProducts = true;
        break;
      case '--skip-customers':
        config.skipCustomers = true;
        break;
      case '--skip-sales':
        config.skipSales = true;
        break;
      case '--skip-inventory-movements':
        config.skipInventoryMovements = true;
        break;
      case '--skip-loyalty-transactions':
        config.skipLoyaltyTransactions = true;
        break;
      case '--skip-audit-logs':
        config.skipAuditLogs = true;
        break;
      case '--skip-system-settings':
        config.skipSystemSettings = true;
        break;
      case '--help':
        console.log(`
Usage: node seedData.js [options]

Options:
  --clear-only                Only wipe database, do not seed.
  --products [count]          Seed products (default: 50)
  --customers [count]         Seed customers (default: 30)
  --sales [count]             Seed sales (default: 100)
  --inventory-movements [count] Seed inventory movements (default: 150)
  --loyalty-transactions [count] Seed loyalty transactions (default: 80)
  --audit-logs [count]        Seed audit logs (default: 60)
  --skip-products             Skip seeding products
  --skip-customers            Skip seeding customers
  --skip-sales                Skip seeding sales
  --skip-inventory-movements  Skip seeding inventory movements
  --skip-loyalty-transactions Skip seeding loyalty transactions
  --skip-audit-logs           Skip seeding audit logs
  --skip-system-settings      Skip seeding system settings
  --help                      Show this help

Examples:
  node seedData.js --products 20 --customers 10
  node seedData.js --clear-only
  node seedData.js --skip-loyalty-transactions
`);
        process.exit(0);
    }
  }
  return config;
}

// ========== EXECUTION ==========
if (require.main === module) {
  const config = parseArgs();
  const seeder = new POSSeeder(config);
  seeder.run().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { POSSeeder, DEFAULT_CONFIG };