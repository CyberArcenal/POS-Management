//@ts-check
const User = require("../../../../entities/User");
const { log_audit } = require("../../../../utils/auditLogger");

/**
 * Update user
 * @param {Object} params
 * @param {import("typeorm").QueryRunner} queryRunner
 */
async function updateUser(params, queryRunner) {
  const { 
    // @ts-ignore
    id,
    // @ts-ignore
    username,
    // @ts-ignore
    role,
    // @ts-ignore
    first_name,
    // @ts-ignore
    last_name,
    // @ts-ignore
    email,
    // @ts-ignore
    employee_id,
    // @ts-ignore
    department,
    // @ts-ignore
    can_manage_products,
    // @ts-ignore
    can_adjust_inventory,
    // @ts-ignore
    can_view_reports,
    // @ts-ignore
    is_active,
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

    // Check if username is being changed and if it's available
    if (username && username !== existingUser.username) {
      const usernameExists = await userRepo.findOne({ where: { username } });
      if (usernameExists) {
        return {
          status: false,
          message: "Username already exists",
          data: null
        };
      }
    }

    // Update user fields
    const updateData = {};
    
    if (username !== undefined) updateData.username = username;
    if (role !== undefined) updateData.role = role;
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (email !== undefined) updateData.email = email;
    if (employee_id !== undefined) updateData.employee_id = employee_id;
    if (department !== undefined) updateData.department = department;
    if (can_manage_products !== undefined) updateData.can_manage_products = can_manage_products;
    if (can_adjust_inventory !== undefined) updateData.can_adjust_inventory = can_adjust_inventory;
    if (can_view_reports !== undefined) updateData.can_view_reports = can_view_reports;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Update display name if first or last name changed
    if (first_name !== undefined || last_name !== undefined) {
      const newFirstName = first_name !== undefined ? first_name : existingUser.first_name;
      const newLastName = last_name !== undefined ? last_name : existingUser.last_name;
      // @ts-ignore
      updateData.display_name = `${newFirstName} ${newLastName}`.trim();
    }

    // Update timestamps
    updateData.updated_at = new Date();

    await userRepo.update(id, updateData);

    // Get updated user
    const updatedUser = await userRepo.findOne({ where: { id } });
    // @ts-ignore
    const { password, ...userData } = updatedUser;

    // Log activity
    await log_audit("update", "User", id, _userId, {
      updated_fields: Object.keys(updateData),
      old_values: {
        username: existingUser.username,
        role: existingUser.role,
        is_active: existingUser.is_active
      },
      new_values: {
        // @ts-ignore
        username: updatedUser.username,
        // @ts-ignore
        role: updatedUser.role,
        // @ts-ignore
        is_active: updatedUser.is_active
      }
    });

    return {
      status: true,
      message: "User updated successfully",
      data: userData
    };
  } catch (error) {
    console.error("updateUser error:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to update user: ${error.message}`,
      data: null
    };
  }
}

module.exports = updateUser;