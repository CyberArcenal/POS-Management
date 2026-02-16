// src/renderer/api/supplierAPI.ts
// Similar structure to audit.ts

// ----------------------------------------------------------------------
// 📦 Types & Interfaces (mirror backend entities)
// ----------------------------------------------------------------------

export interface Supplier {
  id: number;
  name: string;
  contactInfo: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;        // ISO date
  updatedAt: string | null;

  // optional relations (if eager loaded)
  products?: Product[];
}

// Minimal Product type for relation
export interface Product {
  id: number;
  sku: string;
  name: string;
  price: number;
}

// ----------------------------------------------------------------------
// 📦 Statistics & Aggregation Types
// ----------------------------------------------------------------------

export interface SupplierStatistics {
  totalActive: number;
  totalInactive: number;
  totalProducts: number;                     // total products from active suppliers
  suppliersWithProductCount: SupplierWithProductCount[];
}

export interface SupplierWithProductCount {
  id: number;
  name: string;
  productCount: number;
}

export interface SupplierCounts {
  byStatus: { status: string; count: number }[];
  byProductRange: { range: string; count: number }[];
}

// ----------------------------------------------------------------------
// 📨 Request/Response Interfaces (mirror IPC response format)
// ----------------------------------------------------------------------

// Basic response structure used by all IPC handlers
export interface BaseResponse<T = any> {
  status: boolean;
  message: string;
  data: T;
}

// Specific response types for clarity
export interface SuppliersResponse extends BaseResponse<Supplier[]> {}
export interface SupplierResponse extends BaseResponse<Supplier> {}
export interface SupplierStatisticsResponse extends BaseResponse<SupplierStatistics> {}
export interface SuppliersWithProductCountResponse extends BaseResponse<SupplierWithProductCount[]> {}
export interface DeleteResponse extends BaseResponse<{ success: boolean; id: number }> {}
export interface BulkCreateResponse extends BaseResponse<{
  created: Supplier[];
  errors: Array<{ data: any; error: string }>;
}> {}
export interface ExportResult {
  filePath: string;
  format: string;
  data?: string;           // for CSV export, the actual CSV content may be returned
}
export interface ExportResponse extends BaseResponse<ExportResult> {}

// ----------------------------------------------------------------------
// 🧠 SupplierAPI Class
// ----------------------------------------------------------------------

class SupplierAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  /**
   * Get all suppliers with optional filtering, sorting, and pagination
   * @param params.isActive - Filter by active status
   * @param params.search - Search term (name, contact, address)
   * @param params.sortBy - Field to sort by (e.g., 'name', 'createdAt')
   * @param params.sortOrder - 'ASC' or 'DESC'
   * @param params.page - Page number (1‑based)
   * @param params.limit - Items per page (default 20, max 100)
   */
  async getAll(params?: {
    isActive?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
    page?: number;
    limit?: number;
  }): Promise<SuppliersResponse> {
    try {
      if (!window.backendAPI?.supplier) {
        throw new Error("Electron API (supplier) not available");
      }

      const response = await window.backendAPI.supplier({
        method: "getAllSuppliers",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch suppliers");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch suppliers");
    }
  }

  /**
   * Get a single supplier by ID
   * @param id - Supplier ID
   */
  async getById(id: number): Promise<SupplierResponse> {
    try {
      if (!window.backendAPI?.supplier) {
        throw new Error("Electron API (supplier) not available");
      }

      const response = await window.backendAPI.supplier({
        method: "getSupplierById",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch supplier");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch supplier");
    }
  }

  /**
   * Get all active suppliers
   */
  async getActive(): Promise<SuppliersResponse> {
    try {
      if (!window.backendAPI?.supplier) {
        throw new Error("Electron API (supplier) not available");
      }

      const response = await window.backendAPI.supplier({
        method: "getActiveSuppliers",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch active suppliers");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch active suppliers");
    }
  }

  /**
   * Get supplier statistics (counts, product counts, etc.)
   */
  async getStatistics(): Promise<SupplierStatisticsResponse> {
    try {
      if (!window.backendAPI?.supplier) {
        throw new Error("Electron API (supplier) not available");
      }

      const response = await window.backendAPI.supplier({
        method: "getSupplierStatistics",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch supplier statistics");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch supplier statistics");
    }
  }

  /**
   * Search suppliers by term (name, contact, address)
   * @param term - Search term
   * @param isActive - Optional active filter
   */
  async search(term: string, isActive?: boolean): Promise<SuppliersResponse> {
    try {
      if (!window.backendAPI?.supplier) {
        throw new Error("Electron API (supplier) not available");
      }

      const response = await window.backendAPI.supplier({
        method: "searchSuppliers",
        params: { term, isActive },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to search suppliers");
    } catch (error: any) {
      throw new Error(error.message || "Failed to search suppliers");
    }
  }

  /**
   * Get suppliers with product count (active suppliers only)
   */
  async getWithProductCount(): Promise<SuppliersWithProductCountResponse> {
    try {
      if (!window.backendAPI?.supplier) {
        throw new Error("Electron API (supplier) not available");
      }

      const response = await window.backendAPI.supplier({
        method: "getSuppliersWithProductCount",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch suppliers with product count");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch suppliers with product count");
    }
  }

  // --------------------------------------------------------------------
  // ✏️ WRITE METHODS
  // --------------------------------------------------------------------

  /**
   * Create a new supplier
   * @param data - Supplier data (name required)
   */
  async create(data: {
    name: string;
    contactInfo?: string | null;
    address?: string | null;
    isActive?: boolean;
  }): Promise<SupplierResponse> {
    try {
      if (!window.backendAPI?.supplier) {
        throw new Error("Electron API (supplier) not available");
      }

      const response = await window.backendAPI.supplier({
        method: "createSupplier",
        params: data,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create supplier");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create supplier");
    }
  }

  /**
   * Update an existing supplier
   * @param id - Supplier ID
   * @param data - Fields to update
   */
  async update(
    id: number,
    data: Partial<{
      name: string;
      contactInfo: string | null;
      address: string | null;
      isActive: boolean;
    }>
  ): Promise<SupplierResponse> {
    try {
      if (!window.backendAPI?.supplier) {
        throw new Error("Electron API (supplier) not available");
      }

      const response = await window.backendAPI.supplier({
        method: "updateSupplier",
        params: { id, ...data },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update supplier");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update supplier");
    }
  }

  /**
   * Delete (soft‑delete) a supplier by setting isActive = false
   * @param id - Supplier ID
   */
  async delete(id: number): Promise<DeleteResponse> {
    try {
      if (!window.backendAPI?.supplier) {
        throw new Error("Electron API (supplier) not available");
      }

      const response = await window.backendAPI.supplier({
        method: "deleteSupplier",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to delete supplier");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete supplier");
    }
  }

  /**
   * Bulk create suppliers
   * @param suppliers - Array of supplier objects (each must have at least name)
   */
  async bulkCreate(
    suppliers: Array<{
      name: string;
      contactInfo?: string | null;
      address?: string | null;
      isActive?: boolean;
    }>
  ): Promise<BulkCreateResponse> {
    try {
      if (!window.backendAPI?.supplier) {
        throw new Error("Electron API (supplier) not available");
      }

      const response = await window.backendAPI.supplier({
        method: "bulkCreateSuppliers",
        params: { suppliers },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to bulk create suppliers");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk create suppliers");
    }
  }

  // --------------------------------------------------------------------
  // 📁 EXPORT METHODS
  // --------------------------------------------------------------------

  /**
   * Export suppliers to CSV file
   * @param filters - Optional filters (isActive, search)
   */
  async exportCSV(filters?: {
    isActive?: boolean;
    search?: string;
  }): Promise<ExportResponse> {
    try {
      if (!window.backendAPI?.supplier) {
        throw new Error("Electron API (supplier) not available");
      }

      const response = await window.backendAPI.supplier({
        method: "exportSuppliersToCSV",
        params: { filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to export suppliers");
    } catch (error: any) {
      throw new Error(error.message || "Failed to export suppliers");
    }
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Check if the supplier API is available
   */
  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.supplier);
  }

  /**
   * Get the total number of suppliers (optionally filtered)
   * @param params.isActive - Filter by active status
   */
  async getTotalCount(params?: { isActive?: boolean }): Promise<number> {
    try {
      const response = await this.getAll({ ...params, limit: 1 });
      return response.data.length; // Note: currently backend returns array, not total count
    } catch (error) {
      console.error("Error getting supplier count:", error);
      return 0;
    }
  }

  /**
   * Check if a supplier with the given name exists
   * @param name - Supplier name
   */
  async nameExists(name: string): Promise<boolean> {
    try {
      const response = await this.getAll({ search: name, limit: 1 });
      return response.data.some(s => s.name.toLowerCase() === name.toLowerCase());
    } catch (error) {
      console.error("Error checking supplier name:", error);
      return false;
    }
  }

  /**
   * Check if a specific supplier exists
   * @param id - Supplier ID
   */
  async exists(id: number): Promise<boolean> {
    try {
      const response = await this.getById(id);
      return response.status;
    } catch {
      return false;
    }
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const supplierAPI = new SupplierAPI();
export default supplierAPI;