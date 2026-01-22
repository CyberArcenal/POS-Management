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

  async syncFromInventory(): Promise<SyncResponse> {
    try {
      const response = await productAPI.syncProductsFromInventory({
        fullSync: true
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
}

export const productSyncAPI = new ProductSyncAPI();