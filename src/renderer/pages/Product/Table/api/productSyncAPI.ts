import productAPI from "../../../../api/product";
import type { ProductFilters, ProductsResponse, SyncResponse } from "../types/product.types";

export class ProductSyncAPI {
  async getProducts(filters: ProductFilters = {}): Promise<ProductsResponse> {
    try {
      const { page = 1, limit = 20, ...restFilters } = filters;
      
      const response = await productAPI.findPage(
        restFilters,
        page,
        limit
      );

      return {
        status: response.status,
        message: response.message,
        pagination: response.pagination,
        data: response.data
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
  }

  async syncFromInventory(params?: {
    warehouseId?: string | number;
    fullSync?: boolean;
    incremental?: boolean;
  }): Promise<SyncResponse> {
    try {
      const response = await productAPI.syncProductsFromInventory({
        warehouseId: params?.warehouseId,
        fullSync: params?.fullSync ?? true,
        incremental: params?.incremental ?? false
      });

      return {
        status: response.status,
        message: response.message,
        data: response.data
      };
    } catch (error: any) {
      throw new Error(`Sync failed: ${error.message}`);
    }
  }

  async searchProducts(query: string, page: number = 1): Promise<ProductsResponse> {
    try {
      const response = await productAPI.searchProducts(query);
      
      // Simulate pagination for search results
      const startIndex = (page - 1) * 20;
      const paginatedData = response.data.slice(startIndex, startIndex + 20);
      
      return {
        status: response.status,
        message: response.message,
        pagination: {
          count: response.data.length,
          current_page: page,
          total_pages: Math.ceil(response.data.length / 20),
          page_size: 20,
          next: startIndex + 20 < response.data.length,
          previous: page > 1
        },
        data: paginatedData
      };
    } catch (error: any) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  async getWarehouseProducts(
    warehouseId: string | number,
    filters?: ProductFilters
  ): Promise<ProductsResponse> {
    try {
      const response = await productAPI.getWarehouseProducts(warehouseId, filters);
      
      return {
        status: response.status,
        message: response.message,
        pagination: {
          count: response.data.total,
          current_page: 1,
          total_pages: Math.ceil(response.data.total / 20),
          page_size: 20,
          next: false,
          previous: false
        },
        data: response.data.products
      };
    } catch (error: any) {
      throw new Error(`Failed to get warehouse products: ${error.message}`);
    }
  }

  async getAvailableWarehouses() {
    try {
      return await productAPI.getAvailableWarehouses();
    } catch (error: any) {
      throw new Error(`Failed to get warehouses: ${error.message}`);
    }
  }

  async setCurrentWarehouse(warehouseId: string | number, warehouseName: string) {
    try {
      return await productAPI.setCurrentWarehouse(warehouseId, warehouseName);
    } catch (error: any) {
      throw new Error(`Failed to set warehouse: ${error.message}`);
    }
  }
}

export const productSyncAPI = new ProductSyncAPI();