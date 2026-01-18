// userAPI.ts - Frontend API for User Management
export interface User {
  id: number;
  username: string;
  role: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string | null;
  is_active: boolean;
  employee_id: string | null;
  department: string | null;
  can_manage_products: boolean;
  can_adjust_inventory: boolean;
  can_view_reports: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserActivity {
  id: number;
  user_id: number;
  action: string;
  entity: string | null;
  entity_id: number | null;
  ip_address: string | null;
  user_agent: string | null;
  details: string | null;
  created_at: string;
}

export interface UserPermissions {
  user_id: number;
  username: string;
  role: string;
  permissions: {
    can_view_dashboard: boolean;
    can_manage_users: boolean;
    can_manage_products: boolean;
    can_manage_inventory: boolean;
    can_view_reports: boolean;
    can_process_sales: boolean;
    can_manage_customers: boolean;
    can_manage_suppliers: boolean;
    can_adjust_prices: boolean;
    can_view_audit_logs: boolean;
    can_adjust_inventory: boolean;
  };
}

export interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  users_by_role: Array<{ role: string; count: string }>;
  users_by_department: Array<{ department: string; count: string }>;
  recent_sales: Array<{
    user_id: number;
    sale_count: string;
    total_sales: string;
  }>;
  new_users_this_month: number;
}

export interface UserSalesReport {
  user_id: number;
  period: any;
  summary: {
    total_sales: number;
    total_amount: number;
    average_sale: number;
  };
  top_products: Array<{
    product_id: number;
    product_name: string;
    quantity: number;
    amount: number;
  }>;
  daily_breakdown: Array<{
    date: string;
    sales_count: number;
    total_amount: number;
  }>;
  recent_sales: any[];
}

export interface UserShiftInfo {
  user_id: number;
  today_activities: UserActivity[];
  last_login: UserActivity | null;
  last_logout: UserActivity | null;
  is_currently_logged_in: boolean;
  shift_duration_minutes: number | null;
  shift_status: 'on_shift' | 'off_shift';
}

export interface PaginatedResponse<T> {
  status: boolean;
  message: string;
  pagination: {
    count: number;
    current_page: number;
    total_pages: number;
    page_size: number;
    next: boolean;
    previous: boolean;
  };
  data: T[];
}

export interface UserResponse {
  status: boolean;
  message: string;
  data: User;
}

export interface UsersResponse {
  status: boolean;
  message: string;
  data: User[];
}

export interface UserActivityResponse {
  status: boolean;
  message: string;
  data: UserActivity[];
}

export interface UserPermissionsResponse {
  status: boolean;
  message: string;
  data: UserPermissions;
}

export interface UserStatsResponse {
  status: boolean;
  message: string;
  data: UserStats;
}

export interface UserSalesReportResponse {
  status: boolean;
  message: string;
  data: UserSalesReport;
}

export interface UserShiftInfoResponse {
  status: boolean;
  message: string;
  data: UserShiftInfo;
}

export interface ValidationResponse {
  status: boolean;
  message: string;
  data: {
    valid: boolean;
    user?: User;
  };
}

export interface UsernameAvailabilityResponse {
  status: boolean;
  message: string;
  data: {
    available: boolean;
    username: string;
  };
}

export interface UserOperationResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    username: string;
    [key: string]: any;
  };
}

export interface UserPayload {
  method: string;
  params?: Record<string, any>;
}

class UserAPI {
  // 🔎 Read-only methods
  async getAllUsers(filters?: {
    is_active?: boolean;
    role?: string;
    department?: string;
    exclude_self?: boolean;
  }): Promise<UsersResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "getAllUsers",
        params: { filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get users");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get users");
    }
  }

  async findPage(
    filters: {
      role?: string;
      department?: string;
      is_active?: boolean;
      can_manage_products?: boolean;
      can_adjust_inventory?: boolean;
      search?: string;
      exclude_self?: boolean;
      sort_by?: string;
      sort_order?: 'asc' | 'desc';
    } = {},
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<User>> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "findPage",
        params: { ...filters, page, pageSize },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to find users");
    } catch (error: any) {
      throw new Error(error.message || "Failed to find users");
    }
  }

  async getUserById(id: number): Promise<UserResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "getUserById",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get user");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get user");
    }
  }

  async getUserByUsername(username: string): Promise<UserResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "getUserByUsername",
        params: { username },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get user");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get user");
    }
  }

  async getUsersByRole(
    role: string,
    filters?: { department?: string }
  ): Promise<UsersResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "getUsersByRole",
        params: { role, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get users by role");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get users by role");
    }
  }

  async getActiveUsers(include_inactive: boolean = false): Promise<UsersResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "getActiveUsers",
        params: { include_inactive },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get active users");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get active users");
    }
  }

  async getUserStats(date_range?: {
    start_date?: string;
    end_date?: string;
  }): Promise<UserStatsResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "getUserStats",
        params: { date_range },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get user stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get user stats");
    }
  }

  async searchUsers(query: string): Promise<UsersResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "searchUsers",
        params: { query },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to search users");
    } catch (error: any) {
      throw new Error(error.message || "Failed to search users");
    }
  }

  async getUserActivityLogs(user_id: number): Promise<UserActivityResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "getUserActivityLogs",
        params: { user_id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get activity logs");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get activity logs");
    }
  }

  async getUserPermissions(user_id: number): Promise<UserPermissionsResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "getUserPermissions",
        params: { user_id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get user permissions");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get user permissions");
    }
  }

  async validateUserCredentials(
    username: string,
    password: string
  ): Promise<ValidationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "validateUserCredentials",
        params: { username, password },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to validate credentials");
    } catch (error: any) {
      throw new Error(error.message || "Failed to validate credentials");
    }
  }

  async checkUsernameAvailability(
    username: string
  ): Promise<UsernameAvailabilityResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "checkUsernameAvailability",
        params: { username },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to check username availability");
    } catch (error: any) {
      throw new Error(error.message || "Failed to check username availability");
    }
  }

  async getUserSalesReport(
    user_id: number,
    date_range?: {
      start_date?: string;
      end_date?: string;
    }
  ): Promise<UserSalesReportResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "getUserSalesReport",
        params: { user_id, date_range },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get sales report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get sales report");
    }
  }

  async getUserLoginHistory(user_id: number): Promise<UserActivityResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "getUserLoginHistory",
        params: { user_id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get login history");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get login history");
    }
  }

  async getUsersByDepartment(department: string): Promise<UsersResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "getUsersByDepartment",
        params: { department },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get users by department");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get users by department");
    }
  }

  async getUserShiftInfo(user_id: number): Promise<UserShiftInfoResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "getUserShiftInfo",
        params: { user_id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get shift info");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get shift info");
    }
  }

  // 🔒 Mutating methods
  async createUser(userData: {
    username: string;
    password: string;
    role: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    employee_id?: string;
    department?: string;
    can_manage_products?: boolean;
    can_adjust_inventory?: boolean;
    can_view_reports?: boolean;
  }): Promise<UserOperationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "createUser",
        params: userData,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create user");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create user");
    }
  }

  async updateUser(id: number, userData: {
    username?: string;
    role?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    employee_id?: string;
    department?: string;
    can_manage_products?: boolean;
    can_adjust_inventory?: boolean;
    can_view_reports?: boolean;
    is_active?: boolean;
  }): Promise<UserOperationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "updateUser",
        params: { id, ...userData },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update user");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update user");
    }
  }

  async deleteUser(
    id: number,
    permanent: boolean = false
  ): Promise<UserOperationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "deleteUser",
        params: { id, permanent },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to delete user");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete user");
    }
  }

  async updateUserPassword(
    id: number,
    current_password: string,
    new_password: string,
    confirm_password: string,
    force_reset: boolean = false
  ): Promise<UserOperationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "updateUserPassword",
        params: {
          id,
          current_password,
          new_password,
          confirm_password,
          force_reset,
        },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update password");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update password");
    }
  }

  async updateUserPermissions(
    id: number,
    permissions: {
      can_manage_products?: boolean;
      can_adjust_inventory?: boolean;
      can_view_reports?: boolean;
    }
  ): Promise<UserOperationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "updateUserPermissions",
        params: { id, ...permissions },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update permissions");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update permissions");
    }
  }

  async updateUserRole(id: number, role: string): Promise<UserOperationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "updateUserRole",
        params: { id, role },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update role");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update role");
    }
  }

  async toggleUserStatus(
    id: number,
    status?: boolean
  ): Promise<UserOperationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "toggleUserStatus",
        params: { id, status },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to toggle status");
    } catch (error: any) {
      throw new Error(error.message || "Failed to toggle status");
    }
  }

  async resetUserPassword(
    id: number,
    new_password: string,
    temporary_password: boolean = true
  ): Promise<UserOperationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "resetUserPassword",
        params: { id, new_password, temporary_password },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to reset password");
    } catch (error: any) {
      throw new Error(error.message || "Failed to reset password");
    }
  }

  async logUserLogin(params: {
    user_id?: number;
    username?: string;
    ip_address?: string;
    user_agent?: string;
  }): Promise<UserOperationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "logUserLogin",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to log login");
    } catch (error: any) {
      throw new Error(error.message || "Failed to log login");
    }
  }

  async logUserLogout(params: {
    user_id?: number;
    username?: string;
    ip_address?: string;
    user_agent?: string;
  }): Promise<UserOperationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.user({
        method: "logUserLogout",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to log logout");
    } catch (error: any) {
      throw new Error(error.message || "Failed to log logout");
    }
  }

  // Utility methods
  async getCurrentUser(): Promise<User | null> {
    try {
      // This would typically get the current user from your auth system
      // You might need to adjust this based on how you store current user info
      const response = await this.getUserByUsername('current_user');
      return response.data;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }

  async getMyPermissions(): Promise<UserPermissions | null> {
    try {
      const currentUser = await this.getCurrentUser();
      if (currentUser) {
        const response = await this.getUserPermissions(currentUser.id);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Error getting my permissions:", error);
      return null;
    }
  }

  async hasPermission(permission: keyof UserPermissions['permissions']): Promise<boolean> {
    try {
      const permissions = await this.getMyPermissions();
      return permissions?.permissions[permission] || false;
    } catch (error) {
      console.error("Error checking permission:", error);
      return false;
    }
  }

  async login(username: string, password: string): Promise<{
    success: boolean;
    user?: User;
    message?: string;
  }> {
    try {
      const response = await this.validateUserCredentials(username, password);
      if (response.status && response.data.valid && response.data.user) {
        // Log the login activity
        await this.logUserLogin({
          user_id: response.data.user.id,
          username: response.data.user.username,
        });
        
        return {
          success: true,
          user: response.data.user,
        };
      }
      return {
        success: false,
        message: response.message || "Invalid credentials",
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Login failed",
      };
    }
  }

  async logout(userId: number, username: string): Promise<boolean> {
    try {
      await this.logUserLogout({
        user_id: userId,
        username,
      });
      return true;
    } catch (error) {
      console.error("Error logging out:", error);
      return false;
    }
  }

  async checkAndCreateDefaultAdmin(): Promise<boolean> {
    try {
      // Check if any admin exists
      const response = await this.getUsersByRole('admin');
      if (response.data.length === 0) {
        // Create default admin
        const createResponse = await this.createUser({
          username: 'admin',
          password: 'admin123',
          role: 'admin',
          first_name: 'System',
          last_name: 'Administrator',
          can_manage_products: true,
          can_adjust_inventory: true,
          can_view_reports: true,
        });
        return createResponse.status;
      }
      return true;
    } catch (error) {
      console.error("Error checking/creating default admin:", error);
      return false;
    }
  }

  async getUserWithPermissions(id: number): Promise<{
    user: User;
    permissions: UserPermissions;
  } | null> {
    try {
      const [userResponse, permissionsResponse] = await Promise.all([
        this.getUserById(id),
        this.getUserPermissions(id),
      ]);

      if (userResponse.status && permissionsResponse.status) {
        return {
          user: userResponse.data,
          permissions: permissionsResponse.data,
        };
      }
      return null;
    } catch (error) {
      console.error("Error getting user with permissions:", error);
      return null;
    }
  }

//   // Event listeners (if needed)
//   onUserCreated(callback: (data: any) => void) {
//     if (window.backendAPI && window.backendAPI.onUserCreated) {
//       window.backendAPI.onUserCreated(callback);
//     }
//   }

//   onUserUpdated(callback: (data: any) => void) {
//     if (window.backendAPI && window.backendAPI.onUserUpdated) {
//       window.backendAPI.onUserUpdated(callback);
//     }
//   }

//   onUserDeleted(callback: (data: any) => void) {
//     if (window.backendAPI && window.backendAPI.onUserDeleted) {
//       window.backendAPI.onUserDeleted(callback);
//     }
//   }
}

const userAPI = new UserAPI();

export default userAPI;