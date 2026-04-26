// src/renderer/api/category.ts
// Similar structure to audit.ts

// ----------------------------------------------------------------------
// 📦 Types & Interfaces
// ----------------------------------------------------------------------

export interface Category {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string; // ISO date string
  updatedAt: string | null;
  // Optional relation fields
  products?: Array<{ id: number; name: string }>; // simplified product info
}

export interface PaginatedCategories {
  items: Category[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CategoryStatistics {
  totalActive: number;
  totalInactive: number;
  categoriesWithProductCount: Array<{
    id: number;
    name: string;
    productCount: number;
  }>;
}

export interface CategoryCounts {
  total: number;
  active: number;
  inactive: number;
}

export interface CategoryWithProductCount {
  id: number;
  name: string;
  productCount: number;
}

export interface ExportResult {
  filePath: string;
  format: string;
  filename: string;
  data?: string | any[]; // optional, depending on format
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces (mirror IPC response format)
// ----------------------------------------------------------------------

export interface CategoriesResponse {
  status: boolean;
  message: string;
  data: PaginatedCategories | Category[]; // flexible for different endpoints
}

export interface CategoryResponse {
  status: boolean;
  message: string;
  data: Category;
}

export interface CategoryStatisticsResponse {
  status: boolean;
  message: string;
  data: CategoryStatistics;
}

export interface CategoryCountsResponse {
  status: boolean;
  message: string;
  data: CategoryCounts;
}

export interface CategoryWithProductCountResponse {
  status: boolean;
  message: string;
  data: CategoryWithProductCount[];
}

export interface BulkCreateResponse {
  status: boolean;
  message: string;
  data: Category[]; // created categories
}

export interface ExportResponse {
  status: boolean;
  message: string;
  data: ExportResult;
}

export interface ValidationResponse {
  status: boolean;
  message: string;
  data: boolean;
}

// ----------------------------------------------------------------------
// 🧠 CategoryAPI Class
// ----------------------------------------------------------------------

class CategoryAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  /**
   * Get all categories with optional filters and pagination
   * @param params.search - Search by name
   * @param params.isActive - Filter by active status
   * @param params.page - Page number (1-based)
   * @param params.limit - Items per page (default 50, max 100)
   * @param params.sortBy - Field to sort by (default: createdAt)
   * @param params.sortOrder - 'ASC' or 'DESC' (default: DESC)
   */
  async getAll(params?: {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<CategoriesResponse> {
    try {
      if (!window.backendAPI?.category) {
        throw new Error('Electron API (category) not available');
      }

      const response = await window.backendAPI.category({
        method: 'getAllCategories',
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || 'Failed to fetch categories');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch categories');
    }
  }

  /**
   * Get a single category by ID
   * @param id - Category ID
   */
  async getById(id: number): Promise<CategoryResponse> {
    try {
      if (!window.backendAPI?.category) {
        throw new Error('Electron API (category) not available');
      }

      const response = await window.backendAPI.category({
        method: 'getCategoryById',
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || 'Failed to fetch category');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch category');
    }
  }

  /**
   * Get all active categories
   * @param params.search - Optional search term
   * @param params.page - Page number
   * @param params.limit - Items per page
   */
  async getActive(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<CategoriesResponse> {
    try {
      if (!window.backendAPI?.category) {
        throw new Error('Electron API (category) not available');
      }

      const response = await window.backendAPI.category({
        method: 'getActiveCategories',
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || 'Failed to fetch active categories');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch active categories');
    }
  }

  /**
   * Get category statistics
   */
  async getStatistics(): Promise<CategoryStatisticsResponse> {
    try {
      if (!window.backendAPI?.category) {
        throw new Error('Electron API (category) not available');
      }

      const response = await window.backendAPI.category({
        method: 'getCategoryStatistics',
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || 'Failed to fetch category statistics');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch category statistics');
    }
  }

  /**
   * Search categories by name/description
   * @param query - Search query
   * @param activeOnly - Only active categories
   * @param limit - Max results
   */
  async search(query: string, activeOnly?: boolean, limit?: number): Promise<CategoriesResponse> {
    try {
      if (!window.backendAPI?.category) {
        throw new Error('Electron API (category) not available');
      }

      const response = await window.backendAPI.category({
        method: 'searchCategories',
        params: { query, activeOnly, limit },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || 'Failed to search categories');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to search categories');
    }
  }

  /**
   * Get categories with product count (only active categories)
   * @param activeOnly - Whether to return only active categories (default: true)
   */
  async getWithProductCount(activeOnly: boolean = true): Promise<CategoryWithProductCountResponse> {
    try {
      if (!window.backendAPI?.category) {
        throw new Error('Electron API (category) not available');
      }

      const response = await window.backendAPI.category({
        method: 'getCategoriesWithProductCount',
        params: { activeOnly },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || 'Failed to fetch categories with product count');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch categories with product count');
    }
  }

  // --------------------------------------------------------------------
  // ✏️ WRITE METHODS
  // --------------------------------------------------------------------

  /**
   * Create a new category
   * @param data - Category data
   * @param data.name - Category name (unique)
   * @param data.description - Optional description
   * @param data.isActive - Default true
   * @param user - User performing the action (optional, default 'system')
   */
  async create(data: { name: string; description?: string; isActive?: boolean }, user?: string): Promise<CategoryResponse> {
    try {
      if (!window.backendAPI?.category) {
        throw new Error('Electron API (category) not available');
      }

      const response = await window.backendAPI.category({
        method: 'createCategory',
        params: { ...data, user },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || 'Failed to create category');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create category');
    }
  }

  /**
   * Update an existing category
   * @param id - Category ID
   * @param data - Fields to update (name, description, isActive)
   * @param user - User performing the action (optional)
   */
  async update(id: number, data: { name?: string; description?: string; isActive?: boolean }, user?: string): Promise<CategoryResponse> {
    try {
      if (!window.backendAPI?.category) {
        throw new Error('Electron API (category) not available');
      }

      const response = await window.backendAPI.category({
        method: 'updateCategory',
        params: { id, ...data, user },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || 'Failed to update category');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update category');
    }
  }

  /**
   * Soft delete a category (set isActive = false)
   * @param id - Category ID
   * @param user - User performing the action (optional)
   */
  async delete(id: number, user?: string): Promise<CategoryResponse> {
    try {
      if (!window.backendAPI?.category) {
        throw new Error('Electron API (category) not available');
      }

      const response = await window.backendAPI.category({
        method: 'deleteCategory',
        params: { id, user },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || 'Failed to delete category');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete category');
    }
  }

  /**
   * Bulk create categories
   * @param categories - Array of category objects (name required, description and isActive optional)
   * @param user - User performing the action (optional)
   */
  async bulkCreate(categories: Array<{ name: string; description?: string; isActive?: boolean }>, user?: string): Promise<BulkCreateResponse> {
    try {
      if (!window.backendAPI?.category) {
        throw new Error('Electron API (category) not available');
      }

      const response = await window.backendAPI.category({
        method: 'bulkCreateCategories',
        params: { categories, user },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || 'Failed to bulk create categories');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to bulk create categories');
    }
  }

  // --------------------------------------------------------------------
  // 📁 EXPORT METHODS
  // --------------------------------------------------------------------

  /**
   * Export categories to CSV or JSON
   * @param format - 'csv' or 'json' (default: 'json')
   * @param filters - Optional filters (search, isActive, etc.)
   * @param user - User performing the action (optional)
   */
  async export(format: 'csv' | 'json' = 'json', filters?: { search?: string; isActive?: boolean }, user?: string): Promise<ExportResponse> {
    try {
      if (!window.backendAPI?.category) {
        throw new Error('Electron API (category) not available');
      }

      const response = await window.backendAPI.category({
        method: 'exportCategoriesToCSV', // note: method name is exportCategoriesToCSV even for JSON? In backend it's exportCategoriesToCSV but handles format param.
        params: { format, filters, user },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || 'Failed to export categories');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to export categories');
    }
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Check if a category name is available (not used by another active category)
   * @param name - Category name to check
   * @param excludeId - Optional category ID to exclude from check (for updates)
   */
  async isNameAvailable(name: string, excludeId?: number): Promise<boolean> {
    try {
      // Search for categories with the same name
      const response = await this.search(name, true, 1);
      if (!response.status) return false;
      const items = response.data as Category[];
      if (items.length === 0) return true;
      // If we have an excludeId, check if the found category is the same one
      if (excludeId && items[0].id === excludeId) return true;
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Check if a category has any products associated
   * @param id - Category ID
   */
  async hasProducts(id: number): Promise<boolean> {
    try {
      const stats = await this.getStatistics();
      const cat = stats.data.categoriesWithProductCount.find(c => c.id === id);
      return cat ? cat.productCount > 0 : false;
    } catch {
      return false;
    }
  }

  /**
   * Validate if the backend API is available
   */
  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.category);
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const categoryAPI = new CategoryAPI();
export default categoryAPI;