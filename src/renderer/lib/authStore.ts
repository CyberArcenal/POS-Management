// POS Management Auth Store

import type { User } from "../api/user";

export interface POSUser extends User {
  permissions: string[];
}

export interface POSAuthData {
  user: POSUser;
  token: string;
  expiresIn: number; // in seconds
}

export interface POSAuthState {
  user: POSUser | null;
  token: string | null;
  isAuthenticated: boolean;
}

type POSAuthChangeCallback = (isAuthenticated: boolean) => void;

export class POSAuthStore {
  private readonly APP_NAME = "POS_MANAGEMENT";
  private readonly ACCESS_TOKEN_KEY = `${this.APP_NAME}_token`;
  private readonly USER_DATA_KEY = `${this.APP_NAME}_user`;
  private readonly TOKEN_EXPIRATION_KEY = `${this.APP_NAME}_expiration`;
  private notifying = false;

  // Set auth data for POS
  setAuthData(data: POSAuthData): boolean {
    try {
      const expirationTime = Date.now() + data.expiresIn * 1000;
      localStorage.setItem(this.ACCESS_TOKEN_KEY, data.token);
      localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(data.user));
      localStorage.setItem(this.TOKEN_EXPIRATION_KEY, expirationTime.toString());

      this.notifyAuthChange();
      console.log("POS Auth saved for user:", data.user.username);
      return true;
    } catch (err: any) {
      console.error("Error saving POS auth data:", err);
      return false;
    }
  }

  // Get current auth state
  getState(): POSAuthState {
    return {
      user: this.getUser(),
      token: this.getToken(),
      isAuthenticated: this.isAuthenticated(),
    };
  }

  // Get stored token if not expired
  getToken(): string | null {
    if (this.isTokenExpired()) {
      console.warn("POS Token expired");
      return null;
    }
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  // Get current user
  getUser(): POSUser | null {
    const raw = localStorage.getItem(this.USER_DATA_KEY);
    if (!raw) return null;

    try {
      const userData = JSON.parse(raw) as POSUser;
      // Validate required fields
      if (!userData.id || !userData.username) {
        console.warn("Invalid user data in storage");
        this.clearAuth();
        return null;
      }
      return userData;
    } catch (err: any) {
      console.error("Error parsing POS user data:", err);
      return null;
    }
  }

  // Check user permissions
  hasPermission(permission: string): boolean {
    const user = this.getUser();
    return user?.permissions?.includes(permission) || false;
  }

  // Get user role
  getRole(): string {
    return this.getUser()?.role || '';
  }

  // Check if user is admin
  isAdmin(): boolean {
    const role = this.getRole().toLowerCase();
    return role === 'admin' || role === 'administrator' || role === 'superadmin';
  }

  // Check if user is manager
  isManager(): boolean {
    const role = this.getRole().toLowerCase();
    return role.includes('manager') || role === 'lead' || role === 'supervisor';
  }

  // Check if user is cashier
  isCashier(): boolean {
    const role = this.getRole().toLowerCase();
    return role.includes('cashier') || role === 'sales' || role === 'salesperson';
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    return !!token && !!user && !this.isTokenExpired();
  }

  // Check token expiration
  isTokenExpired(): boolean {
    const exp = localStorage.getItem(this.TOKEN_EXPIRATION_KEY);
    if (!exp) return true;
    
    try {
      const expirationTime = parseInt(exp, 10);
      if (isNaN(expirationTime)) return true;
      return Date.now() >= expirationTime;
    } catch {
      return true;
    }
  }

  // Clear auth data
  clearAuth(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.USER_DATA_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRATION_KEY);
    this.notifyAuthChange();
    console.log("POS Authentication data cleared");
  }

  // Logout and redirect
  logout(): void {
    this.clearAuth();
    window.location.hash = '/pos/login';
  }

  // Notify auth state changes
  private notifyAuthChange(): void {
    if (this.notifying) return;
    this.notifying = true;

    const event = new CustomEvent("posAuthStateChanged", {
      detail: { authenticated: this.isAuthenticated() },
    });
    document.dispatchEvent(event);

    this.notifying = false;
  }

  // Subscribe to auth changes
  subscribe(callback: POSAuthChangeCallback): void {
    window.addEventListener("storage", (e: StorageEvent) => {
      if (
        e.key === this.ACCESS_TOKEN_KEY ||
        e.key === this.TOKEN_EXPIRATION_KEY ||
        e.key === this.USER_DATA_KEY
      ) {
        callback(this.isAuthenticated());
      }
    });
  }

  // Extended user info methods for POS dashboard
  getUserInitials(): string {
    const user = this.getUser();
    if (!user?.username) return 'U';
    
    if (user.first_name && user.last_name) {
      return (user.first_name[0] + user.last_name[0]).toUpperCase();
    }
    
    return user.username
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getUserColorScheme(): { bg: string; text: string } {
    const role = this.getRole().toLowerCase();
    
    if (this.isAdmin()) {
      return { 
        bg: 'var(--gradient-primary)',
        text: 'white'
      };
    }
    
    if (this.isManager()) {
      return { 
        bg: 'var(--gradient-success)',
        text: 'white'
      };
    }
    
    if (this.isCashier()) {
      return { 
        bg: 'var(--gradient-warning)',
        text: 'white'
      };
    }
    
    return { 
      bg: 'var(--card-secondary-bg)',
      text: 'var(--text-primary)'
    };
  }

  // Get dashboard permissions based on user role for POS
  getDashboardPermissions(): {
    canProcessSales: boolean;
    canManageProducts: boolean;
    canManageInventory: boolean;
    canViewReports: boolean;
    canManageCustomers: boolean;
    canManageUsers: boolean;
  } {
    const isAdmin = this.isAdmin();
    const isManager = this.isManager();
    const isCashier = this.isCashier();
    
    return {
      canProcessSales: isAdmin || isManager || isCashier || this.hasPermission('can_process_sales'),
      canManageProducts: isAdmin || isManager || this.hasPermission('can_manage_products'),
      canManageInventory: isAdmin || isManager || this.hasPermission('can_manage_inventory'),
      canViewReports: isAdmin || isManager || this.hasPermission('can_view_reports'),
      canManageCustomers: isAdmin || isManager || this.hasPermission('can_manage_customers'),
      canManageUsers: isAdmin || this.hasPermission('can_manage_users')
    };
  }

  // Get user display info for UI
  getUserDisplayInfo() {
    const user = this.getUser();
    if (!user) return null;
    
    return {
      terminalId: user.id || '',
      name: user.display_name || user.username,
      username: user.username,
      email: user.email,
      role: user.role,
      department: user.department,
      initials: this.getUserInitials(),
      colorScheme: this.getUserColorScheme()
    };
  }

  // Check if user can access a specific POS module
  canAccessModule(module: string): boolean {
    const user = this.getUser();
    if (!user) return false;
    
    // Admin can access everything
    if (this.isAdmin()) return true;
    
    const role = user.role.toLowerCase();
    const permissions = user.permissions || [];
    
    // POS Module-based permission checks
    switch (module) {
      case 'dashboard':
        return true;
        
      case 'sales':
        return this.isCashier() || this.isManager() || this.isAdmin() || 
               permissions.includes('can_process_sales');
               
      case 'products':
        return this.isManager() || this.isAdmin() || 
               permissions.includes('can_manage_products');
               
      case 'inventory':
        return this.isManager() || this.isAdmin() || 
               permissions.includes('can_manage_inventory') || 
               permissions.includes('can_adjust_inventory');
               
      case 'customers':
        return this.isManager() || this.isAdmin() || 
               permissions.includes('can_manage_customers');
               
      case 'reports':
        return this.isManager() || this.isAdmin() || 
               permissions.includes('can_view_reports');
               
      case 'settings':
        return this.isAdmin() || permissions.includes('can_manage_users');
        
      default:
        return false;
    }
  }

  // Get employee ID if available
  getEmployeeId(): string | null {
    const user = this.getUser();
    return user?.employee_id || null;
  }

  // Validate session
  validateSession(): { isValid: boolean; user: POSUser | null; reason?: string } {
    if (!this.isAuthenticated()) {
      return { isValid: false, user: null, reason: 'Not authenticated' };
    }
    
    const user = this.getUser();
    if (!user) {
      return { isValid: false, user: null, reason: 'User data not found' };
    }
    
    return { isValid: true, user };
  }

  // Get shift status for POS
  getShiftStatus(): 'active' | 'inactive' {
    // This would typically check if the user is currently in a shift
    // For now, we'll assume active if authenticated
    return this.isAuthenticated() ? 'active' : 'inactive';
  }

  // Check if user can perform specific POS actions
  canPerformAction(action: string): boolean {
    const user = this.getUser();
    if (!user) return false;

    switch (action) {
      case 'adjust_prices':
        return this.isAdmin() || this.isManager() || this.hasPermission('can_adjust_prices');
      
      case 'void_transaction':
        return this.isAdmin() || this.isManager();
      
      case 'apply_discount':
        return this.isAdmin() || this.isManager() || this.isCashier();
      
      case 'manage_suppliers':
        return this.isAdmin() || this.isManager() || this.hasPermission('can_manage_suppliers');
      
      case 'view_audit_logs':
        return this.isAdmin() || this.hasPermission('can_view_audit_logs');
      
      default:
        return false;
    }
  }
}

// Export singleton instance for POS
export const posAuthStore = new POSAuthStore();