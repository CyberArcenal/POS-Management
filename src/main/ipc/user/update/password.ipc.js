//@ts-check
const bcrypt = require("bcryptjs");
const User = require("../../../../entities/User");
const { log_audit } = require("../../../../utils/auditLogger");


/**
 * @param {{ id: any; current_password: any; new_password: any; confirm_password: any; force_reset?: false | undefined; _userId: any; }} params
 * @param {{ manager: { getRepository: (arg0: any) => any; }; }} queryRunner
 */
async function updateUserPassword(params, queryRunner) {
  const { 
    // @ts-ignore
    id,
    // @ts-ignore
    current_password,
    // @ts-ignore
    new_password,
    // @ts-ignore
    confirm_password,
    // @ts-ignore
    force_reset = false,
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

    // If not forced reset, verify current password
    if (!force_reset) {
      if (!current_password) {
        return {
          status: false,
          message: "Current password is required",
          data: null
        };
      }

      // @ts-ignore
      const isValidPassword = await bcrypt.compare(current_password, existingUser.password || '');
      if (!isValidPassword) {
        await log_audit("password_change_attempt", "User", id, _userId, {
          result: "incorrect_current_password"
        });

        return {
          status: false,
          message: "Current password is incorrect",
          data: null
        };
      }
    }

    // Validate new password
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
        message: "New password must be at least 6 characters",
        data: null
      };
    }

    if (!confirm_password || new_password !== confirm_password) {
      return {
        status: false,
        message: "New passwords do not match",
        data: null
      };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password
    await userRepo.update(id, {
      password: hashedPassword,
      updated_at: new Date()
    });

    // Log activity
    await log_audit("password_change", "User", id, _userId, {
      changed_by: _userId === id ? "self" : "admin",
      force_reset: force_reset
    });

    return {
      status: true,
      message: "Password updated successfully",
      data: {
        id: id,
        username: existingUser.username
      }
    };
  } catch (error) {
    console.error("updateUserPassword error:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to update password: ${error.message}`,
      data: null
    };
  }
}

module.exports = updateUserPassword;