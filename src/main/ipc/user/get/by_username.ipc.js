//@ts-check
const User = require("../../../../entities/User");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get user by username
 * @param {string} username
 * @param {number} userId
 */
async function getUserByUsername(username, userId) {
  try {
    if (!username) {
      return {
        status: false,
        message: "Username is required",
        data: null
      };
    }

    const userRepo = AppDataSource.getRepository(User);
    
    const user = await userRepo.findOne({
      where: { username: username },
      relations: ['sales', 'inventory_transactions', 'price_changes']
    });

    if (!user) {
      await log_audit("view", "User", 0, userId, {
        username: username,
        result: "not_found"
      });

      return {
        status: false,
        message: "User not found",
        data: null
      };
    }

    // Remove sensitive data
    const { password, ...userData } = user;

    // @ts-ignore
    await log_audit("view", "User", user.id, userId, {
      username: user.username
    });

    return {
      status: true,
      message: "User retrieved successfully",
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

module.exports = getUserByUsername;