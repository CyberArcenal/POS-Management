# Product Management Module

## Overview
Modular product management page for POS desktop application with:
- Product listing with pagination
- Sync from inventory system
- Search and filtering
- Real-time stock status

## API Integration
- GET `/products?page=1&limit=20` - Fetch paginated products
- POST `/sync/products` - Trigger inventory sync
- Uses existing `productAPI` and `syncAPI` from codebase

## Components
- `ProductTable`: Displays product list with stock indicators
- `PaginationControls`: Reusable pagination component
- `SyncButton`: Trigger inventory sync with loading state

## Hooks
- `useProducts`: Manage product data with filters and pagination
- `useSync`: Handle inventory sync operations

## Context
- `ProductContext`: Global state management for products