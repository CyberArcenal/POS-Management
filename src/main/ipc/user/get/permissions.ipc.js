//@ts-check
const User = require("../../../../entities/User");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get user permissions
 * @param {number} user_id
 * @param {number} userId
 */
async function getUserPermissions(user_id, userId) {
  try {
    if (!user_id) {
      return {
        status: false,
        message: "User ID is required",
        data: null
      };
    }

    const userRepo = AppDataSource.getRepository(User);
    
    const user = await userRepo.findOne({
      where: { id: user_id },
      select: [
        'id', 'username', 'role',
        'can_manage_products', 'can_adjust_inventory', 'can_view_reports'
      ]
    });

    if (!user) {
      return {
        status: false,
        message: "User not found",
        data: null
      };
    }

    // Define role-based permissions
    const rolePermissions = {
      admin: {
        can_view_dashboard: true,
        can_manage_users: true,
        can_manage_products: true,
        can_manage_inventory: true,
        can_view_reports: true,
        can_process_sales: true,
        can_manage_customers: true,
        can_manage_suppliers: true,
        can_adjust_prices: true,
        can_view_audit_logs: true
      },
      manager: {
        can_view_dashboard: true,
        can_manage_users: false,
        can_manage_products: true,
        can_manage_inventory: true,
        can_view_reports: true,
        can_process_sales: true,
        can_manage_customers: true,
        can_manage_suppliers: true,
        can_adjust_prices: true,
        can_view_audit_logs: true
      },
      cashier: {
        can_view_dashboard: true,
        can_manage_users: false,
        can_manage_products: false,
        can_manage_inventory: false,
        can_view_reports: true,
        can_process_sales: true,
        can_manage_customers: true,
        can_manage_suppliers: false,
        can_adjust_prices: false,
        can_view_audit_logs: false
      },
      stock_clerk: {
        can_view_dashboard: true,
        can_manage_users: false,
        can_manage_products: false,
        can_manage_inventory: true,
        can_view_reports: true,
        can_process_sales: false,
        can_manage_customers: false,
        can_manage_suppliers: true,
        can_adjust_prices: false,
        can_view_audit_logs: false
      }
    };

    // Get base permissions from role
    // @ts-ignore
    const basePermissions = rolePermissions[user.role?.toLowerCase()] || rolePermissions.cashier;

    // Override with user-specific permissions
    const permissions = {
      ...basePermissions,
      can_manage_products: user.can_manage_products ?? basePermissions.can_manage_products,
      can_adjust_inventory: user.can_adjust_inventory ?? basePermissions.can_manage_inventory,
      can_view_reports: user.can_view_reports ?? basePermissions.can_view_reports
    };

    await log_audit("fetch_permissions", "User", user_id, userId, {
      role: user.role,
      permissions: Object.keys(permissions).filter(key => permissions[key])
    });

    return {
      status: true,
      message: "Permissions retrieved successfully",
      data: {
        user_id: user.id,
        username: user.username,
        role: user.role,
        permissions: permissions
      }
    };
  } catch (error) {
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null
    };
  }
}

module.exports = getUserPermissions;