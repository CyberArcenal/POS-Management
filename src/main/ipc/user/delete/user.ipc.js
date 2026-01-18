//@ts-check
const User = require("../../../../entities/User");
const { log_audit } = require("../../../../utils/auditLogger");

/**
 * Delete user (soft delete by setting is_active to false)
 * @param {Object} params
 * @param {import("typeorm").QueryRunner} queryRunner
 */
async function deleteUser(params, queryRunner) {
  const { 
    // @ts-ignore
    id,
    // @ts-ignore
    permanent = false,
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

    // Check if trying to delete self
    if (id === _userId) {
      return {
        status: false,
        message: "Cannot delete your own account",
        data: null
      };
    }

    let result;
    
    if (permanent) {
      // Permanent deletion (only for admin)
      await userRepo.delete(id);
      result = "permanently_deleted";
    } else {
      // Soft delete (deactivate)
      await userRepo.update(id, {
        is_active: false,
        updated_at: new Date()
      });
      result = "deactivated";
    }

    // Log activity
    await log_audit("delete", "User", id, _userId, {
      username: existingUser.username,
      action: permanent ? "permanent_delete" : "deactivate",
      old_status: existingUser.is_active
    });

    return {
      status: true,
      message: `User ${result === 'permanently_deleted' ? 'permanently deleted' : 'deactivated'} successfully`,
      data: {
        id: id,
        username: existingUser.username,
        action: result
      }
    };
  } catch (error) {
    console.error("deleteUser error:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to delete user: ${error.message}`,
      data: null
    };
  }
}

module.exports = deleteUser;