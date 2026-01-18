//@ts-check
const bcrypt = require("bcrypt");
const User = require("../../../entities/User");
const { log_audit } = require("../../../utils/auditLogger");

/**
 * Reset user password (admin function)
 * @param {Object} params
 * @param {import("typeorm").QueryRunner} queryRunner
 */
async function resetUserPassword(params, queryRunner) {
  const { 
    // @ts-ignore
    id,
    // @ts-ignore
    new_password,
    // @ts-ignore
    temporary_password = true,
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

    if (!new_password) {
      return {
        status: false,
        message: "New password is required",
        data: null
      };
    }

    if (new_password.length < 6) {
      return {
        status: false,
        message: "Password must be at least 6 characters",
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

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password
    await userRepo.update(id, {
      password: hashedPassword,
      updated_at: new Date(),
      // You could add a flag for temporary password if needed
      // temporary_password: temporary_password
    });

    // Log activity
    await log_audit("password_reset", "User", id, _userId, {
      reset_by: "admin",
      temporary_password: temporary_password,
      username: existingUser.username
    });

    return {
      status: true,
      message: temporary_password ? 
        "Temporary password set successfully. User should change it on next login." :
        "Password reset successfully",
      data: {
        id: id,
        username: existingUser.username,
        temporary_password: temporary_password
      }
    };
  } catch (error) {
    console.error("resetUserPassword error:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to reset password: ${error.message}`,
      data: null
    };
  }
}

module.exports = resetUserPassword;