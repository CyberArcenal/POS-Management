//@ts-check
const User = require("../../../../entities/User");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get user by ID
 * @param {number} id
 * @param {number} userId
 */
async function getUserById(id, userId) {
  try {
    if (!id) {
      return {
        status: false,
        message: "User ID is required",
        data: null
      };
    }

    const userRepo = AppDataSource.getRepository(User);
    
    const user = await userRepo.findOne({
      where: { id: id },
      relations: ['sales', 'inventory_transactions', 'price_changes']
    });

    if (!user) {
      await log_audit("view", "User", id, userId, {
        result: "not_found"
      });

      return {
        status: false,
        message: "User not found",
        data: null
      };
    }

    // Remove sensitive data
    // @ts-ignore
    const { password, ...userData } = user;

    await log_audit("view", "User", id, userId, {
      username: user.username,
      role: user.role
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

module.exports = getUserById;