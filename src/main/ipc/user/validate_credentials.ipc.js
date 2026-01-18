//@ts-check
const bcrypt = require("bcrypt");
const User = require("../../../entities/User");
const { AppDataSource } = require("../../db/dataSource");
const { log_audit } = require("../../../utils/auditLogger");

/**
 * Validate user credentials
 * @param {string} username
 * @param {string} password
 * @param {number} userId
 */
// @ts-ignore
async function validateUserCredentials(username, password, userId) {
  try {
    if (!username || !password) {
      return {
        status: false,
        message: "Username and password are required",
        data: null
      };
    }

    const userRepo = AppDataSource.getRepository(User);
    
    const user = await userRepo.findOne({
      where: { username: username }
    });

    if (!user) {
      await log_audit("login_attempt", "User", 0, 0, {
        username: username,
        result: "user_not_found"
      });

      return {
        status: false,
        message: "Invalid credentials",
        data: null
      };
    }

    if (!user.is_active) {
      // @ts-ignore
      await log_audit("login_attempt", "User", user.id, 0, {
        username: username,
        result: "account_inactive"
      });

      return {
        status: false,
        message: "Account is inactive",
        data: null
      };
    }

    // Verify password
    // @ts-ignore
    const isValidPassword = await bcrypt.compare(password, user.password || '');

    if (!isValidPassword) {
      // @ts-ignore
      await log_audit("login_attempt", "User", user.id, 0, {
        username: username,
        result: "invalid_password"
      });

      return {
        status: false,
        message: "Invalid credentials",
        data: null
      };
    }

    // Remove password from response
    const { password: _, ...userData } = user;

    // @ts-ignore
    await log_audit("login_success", "User", user.id, user.id, {
      username: username,
      role: user.role
    });

    return {
      status: true,
      message: "Credentials validated successfully",
      data: userData
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

module.exports = validateUserCredentials;