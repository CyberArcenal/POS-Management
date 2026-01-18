//@ts-check
const User = require("../../../../entities/User");
const { log_audit } = require("../../../../utils/auditLogger");

/**
 * Update user role
 * @param {Object} params
 * @param {import("typeorm").QueryRunner} queryRunner
 */
async function updateUserRole(params, queryRunner) {
  const { 
    // @ts-ignore
    id,
    // @ts-ignore
    role,
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

    if (!role) {
      return {
        status: false,
        message: "Role is required",
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

    // Update role
    await userRepo.update(id, {
      role: role,
      updated_at: new Date()
    });

    // Get updated user
    const updatedUser = await userRepo.findOne({ where: { id } });
    // @ts-ignore
    const { password, ...userData } = updatedUser;

    // Log activity
    await log_audit("update_role", "User", id, _userId, {
      old_role: existingUser.role,
      // @ts-ignore
      new_role: updatedUser.role
    });

    return {
      status: true,
      message: "Role updated successfully",
      data: userData
    };
  } catch (error) {
    console.error("updateUserRole error:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to update role: ${error.message}`,
      data: null
    };
  }
}

module.exports = updateUserRole;