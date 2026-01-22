import userAPI from "../../api/user";
import type { AuditLog, PaginatedResponse, User, UserFilters, UserFormData } from "../types/user.types";

class UserService {
  async getUsers(
    page: number = 1,
    limit: number = 20,
    filters?: UserFilters
  ): Promise<PaginatedResponse<User>> {
    try {
      const response = await userAPI.findPage({
        ...filters,
        search: filters?.search,
        role: filters?.role,
        is_active: filters?.status === 'active' ? true : 
                  filters?.status === 'inactive' ? false : undefined,
      }, page, limit);

      return {
        data: response.data,
        pagination: {
          page: response.pagination.current_page,
          limit: response.pagination.page_size,
          total: response.pagination.count,
          total_pages: response.pagination.total_pages,
        }
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getUserById(id: number): Promise<User> {
    try {
      const response = await userAPI.getUserById(id);
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  async createUser(userData: UserFormData): Promise<User> {
    try {
      const response = await userAPI.createUser({
        username: userData.username,
        password: userData.password || 'defaultPassword123',
        role: userData.roles[0] || 'user',
        first_name: userData.display_name.split(' ')[0],
        last_name: userData.display_name.split(' ').slice(1).join(' '),
        email: userData.email,
        department: userData.department,
        can_manage_products: userData.roles.includes('admin') || userData.roles.includes('manager'),
        can_adjust_inventory: userData.roles.includes('admin') || userData.roles.includes('inventory'),
        can_view_reports: userData.roles.includes('admin') || userData.roles.includes('manager'),
        is_active: userData.status === 'active',
      });

      await this.logAudit('CREATE_USER', 'User', response.data.id, {
        action: 'create',
        user_data: userData,
      });

      return this.mapAPIUserToUser(response.data);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: number, userData: Partial<UserFormData>): Promise<User> {
    try {
      const response = await userAPI.updateUser(id, {
        username: userData.username,
        first_name: userData.display_name?.split(' ')[0],
        last_name: userData.display_name?.split(' ').slice(1).join(' '),
        email: userData.email,
        department: userData.department,
        can_manage_products: userData.roles?.includes('admin') || userData.roles?.includes('manager'),
        can_adjust_inventory: userData.roles?.includes('admin') || userData.roles?.includes('inventory'),
        can_view_reports: userData.roles?.includes('admin') || userData.roles?.includes('manager'),
        is_active: userData.status === 'active',
      });

      await this.logAudit('UPDATE_USER', 'User', id, {
        action: 'update',
        updated_fields: Object.keys(userData),
      });

      return this.mapAPIUserToUser(response.data);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async updateUserPassword(id: number, currentPassword: string, newPassword: string): Promise<void> {
    try {
      await userAPI.updateUserPassword(id, currentPassword, newPassword, newPassword, false);
      
      await this.logAudit('UPDATE_USER_PASSWORD', 'User', id, {
        action: 'update_password',
      });
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  async updateUserStatus(id: number, status: 'active' | 'inactive'): Promise<void> {
    try {
      await userAPI.toggleUserStatus(id, status === 'active');
      
      await this.logAudit('UPDATE_USER_STATUS', 'User', id, {
        action: 'update_status',
        status,
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  async updateUserRoles(id: number, roles: string[]): Promise<void> {
    try {
      // Note: Your API might need adjustment for roles management
      await userAPI.updateUserRole(id, roles[0] || 'user');
      
      await this.logAudit('UPDATE_USER_ROLES', 'User', id, {
        action: 'update_roles',
        roles,
      });
    } catch (error) {
      console.error('Error updating user roles:', error);
      throw error;
    }
  }

  async deleteUser(id: number, permanent: boolean = false): Promise<void> {
    try {
      await userAPI.deleteUser(id, permanent);
      
      await this.logAudit('DELETE_USER', 'User', id, {
        action: 'delete',
        permanent,
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async bulkUpdateUsers(ids: number[], action: 'activate' | 'deactivate' | 'delete'): Promise<void> {
    try {
      // Implement bulk actions based on your API
      for (const id of ids) {
        switch (action) {
          case 'activate':
            await this.updateUserStatus(id, 'active');
            break;
          case 'deactivate':
            await this.updateUserStatus(id, 'inactive');
            break;
          case 'delete':
            await this.deleteUser(id, false);
            break;
        }
      }

      await this.logAudit('BULK_USER_ACTION', 'User', 0, {
        action: `bulk_${action}`,
        user_ids: ids,
        count: ids.length,
      });
    } catch (error) {
      console.error('Error in bulk update:', error);
      throw error;
    }
  }

  async getAuditLogs(
    entity?: string,
    entityId?: number,
    limit: number = 50
  ): Promise<AuditLog[]> {
    try {
      // Use your existing user activity API
      const response = await userAPI.getUserActivityLogs(entityId || 0);
      return response.data.map((log: any) => ({
        id: log.id,
        user_id: log.user_id,
        action: log.action,
        entity: log.entity || 'User',
        entity_id: log.entity_id || 0,
        details: log.details ? JSON.parse(log.details) : {},
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        created_at: log.created_at,
      }));
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }

  private async logAudit(
    action: string,
    entity: string,
    entityId: number,
    details: Record<string, any>
  ): Promise<void> {
    try {
      await userAPI.logUserLogin({
        user_id: 1, // This should be the current user's ID
        details: JSON.stringify({
          action,
          entity,
          entity_id: entityId,
          ...details,
        }),
      });
    } catch (error) {
      console.error('Error logging audit:', error);
    }
  }

  private mapAPIUserToUser(apiUser: any): User {
    return {
      id: apiUser.id,
      email: apiUser.email || '',
      display_name: apiUser.display_name || `${apiUser.first_name || ''} ${apiUser.last_name || ''}`.trim(),
      username: apiUser.username,
      roles: [apiUser.role],
      status: apiUser.is_active ? 'active' : 'inactive',
      is_deleted: false,
      created_at: apiUser.created_at,
      updated_at: apiUser.updated_at,
      last_login: apiUser.last_login_at,
      created_by: null,
      department: apiUser.department,
    };
  }
}

export const userService = new UserService();