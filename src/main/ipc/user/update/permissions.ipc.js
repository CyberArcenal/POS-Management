//@ts-check
const User = require("../../../../entities/User");
const { log_audit } = require("../../../../utils/auditLogger");

/**
 * Update user permissions
 * @param {Object} params
 * @param {import("typeorm").QueryRunner} queryRunner
 */
async function updateUserPermissions(params, queryRunner) {
  const { 
    // @ts-ignore
    id,
    // @ts-ignore
    can_manage_products,
    // @ts-ignore
    can_adjust_inventory,
    // @ts-ignore
    can_view_reports,
    // @ts-ignore
    _userId 
  } = params;

  try {
    if (!id) {
      return {
        status: false,
        message: "User ID is required",
        data: null
      };
    }

    const userRepo = queryRunner.manager.getRepository(User);

    // Get existing user
    const existingUser = await userRepo.findOne({ where: { id } });
    if (!existingUser) {
      return {
        status: false,
        message: "User not found",
        data: null
      };
    }

    // Update permissions
    const updateData = {
      updated_at: new Date()
    };

    // @ts-ignore
    if (can_manage_products !== undefined) updateData.can_manage_products = can_manage_products;
    // @ts-ignore
    if (can_adjust_inventory !== undefined) updateData.can_adjust_inventory = can_adjust_inventory;
    // @ts-ignore
    if (can_view_reports !== undefined) updateData.can_view_reports = can_view_reports;

    await userRepo.update(id, updateData);

    // Get updated user
    const updatedUser = await userRepo.findOne({ where: { id } });
    // @ts-ignore
    const { password, ...userData } = updatedUser;

    // Log activity
    await log_audit("update_permissions", "User", id, _userId, {
      old_permissions: {
        can_manage_products: existingUser.can_manage_products,
        can_adjust_inventory: existingUser.can_adjust_inventory,
        can_view_reports: existingUser.can_view_reports
      },
      new_permissions: {
        // @ts-ignore
        can_manage_products: updatedUser.can_manage_products,
        // @ts-ignore
        can_adjust_inventory: updatedUser.can_adjust_inventory,
        // @ts-ignore
        can_view_reports: updatedUser.can_view_reports
      }
    });

    return {
      status: true,
      message: "Permissions updated successfully",
      data: userData
    };
  } catch (error) {
    console.error("updateUserPermissions error:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to update permissions: ${error.message}`,
      data: null
    };
  }
}

module.exports = updateUserPermissions;