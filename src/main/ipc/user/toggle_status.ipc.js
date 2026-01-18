//@ts-check

const User = require("../../../entities/User");
const { log_audit } = require("../../../utils/auditLogger");

/**
 * Toggle user active status
 * @param {Object} params
 * @param {import("typeorm").QueryRunner} queryRunner
 */
async function toggleUserStatus(params, queryRunner) {
  const { 
    // @ts-ignore
    id,
    // @ts-ignore
    status,
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

    // Check if trying to toggle self
    if (id === _userId) {
      return {
        status: false,
        message: "Cannot change your own status",
        data: null
      };
    }

    // Determine new status
    const newStatus = status !== undefined ? status : !existingUser.is_active;

    // Update status
    await userRepo.update(id, {
      is_active: newStatus,
      updated_at: new Date()
    });

    // Get updated user
    const updatedUser = await userRepo.findOne({ where: { id } });
    // @ts-ignore
    const { password, ...userData } = updatedUser;

    // Log activity
    await log_audit("toggle_status", "User", id, _userId, {
      old_status: existingUser.is_active,
      // @ts-ignore
      new_status: updatedUser.is_active,
      username: existingUser.username
    });

    return {
      status: true,
      message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`,
      data: userData
    };
  } catch (error) {
    console.error("toggleUserStatus error:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to toggle user status: ${error.message}`,
      data: null
    };
  }
}

module.exports = toggleUserStatus;