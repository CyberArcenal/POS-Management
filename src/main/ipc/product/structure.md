src/ipc/product/
├── create.ipc.js              # Create new product
├── update.ipc.js              # Update existing product
├── delete.ipc.js              # Soft delete product
├── get/
│   ├── by_id.ipc.js          # Get product by ID
│   └── by_barcode.ipc.js     # Get product by barcode
├── find_page.ipc.js           # Paginated product list
├── search.ipc.js              # Search products
├── low_stock.ipc.js           # Get low stock products
├── validate_sku.ipc.js        # Validate SKU uniqueness
├── update_stock.ipc.js        # Manual stock adjustment
├── adjust_inventory.ipc.js    # Inventory adjustments
├── update_price.ipc.js        # Update product price
├── bulk_update.ipc.js         # Bulk update products
├── bulk_update_prices.ipc.js  # Bulk update prices
├── get_warehouse_products.ipc.js  # Get products by warehouse
├── sync_from_inventory.ipc.js      # Sync from external inventory
├── import.ipc.js              # Import products from CSV/Excel
└── export.ipc.js              # Export products to CSV/Excel