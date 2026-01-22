customers/
├── index.ipc.js              # Main handler
├── create.ipc.js            # Create customer
├── update.ipc.js            # Update customer
├── delete.ipc.js            # Delete customer
├── activate.ipc.js          # Activate customer
├── deactivate.ipc.js        # Deactivate customer
├── find_page.ipc.js         # Paginated list
├── search.ipc.js            # Search customers
├── get/
│   ├── all.ipc.js           # Get all customers
│   ├── by_id.ipc.js         # Get by ID
│   ├── by_code.ipc.js       # Get by customer code
│   ├── by_type.ipc.js       # Get by type
│   ├── by_status.ipc.js     # Get by status
│   └── by_group.ipc.js      # Get by group
├── contacts/
│   ├── add.ipc.js           # Add contact
│   ├── update.ipc.js        # Update contact
│   ├── delete.ipc.js        # Delete contact
│   └── get_all.ipc.js       # Get all contacts
├── financial/
│   ├── update_balance.ipc.js
│   ├── add_transaction.ipc.js
│   ├── get_transactions.ipc.js
│   ├── get_balance.ipc.js
│   └── get_statement.ipc.js
└── analytics/
    ├── stats.ipc.js         # Customer statistics
    ├── top_customers.ipc.js # Top customers by revenue
    ├── lifetime_value.ipc.js
    └── purchase_history.ipc.js