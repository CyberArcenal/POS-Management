//@ts-check
const User = require("../../../entities/User");
const { AppDataSource } = require("../../db/dataSource");
const { log_audit } = require("../../../utils/auditLogger");

/**
 * Search users by username, name, email, or employee ID
 * @param {string} query
 * @param {number} userId
 */
async function searchUsers(query, userId) {
  try {
    if (!query || query.trim().length < 2) {
      return {
        status: false,
        message: "Search query must be at least 2 characters",
        data: []
      };
    }

    const userRepo = AppDataSource.getRepository(User);
    
    const users = await userRepo
      .createQueryBuilder("user")
      .where("user.is_active = :is_active", { is_active: true })
      .andWhere(
        "(user.username LIKE :query OR user.first_name LIKE :query OR user.last_name LIKE :query OR user.email LIKE :query OR user.employee_id LIKE :query OR user.department LIKE :query)",
        { query: `%${query}%` }
      )
      .orderBy("user.username", "ASC")
      .limit(20)
      .getMany();

    // Remove sensitive data
    const sanitizedUsers = users.map(user => {
      const { ...userData } = user;
      // Remove password field if it exists
      // @ts-ignore
      delete userData.password;
      return userData;
    });

    await log_audit("search", "User", 0, userId, {
      query,
      results: sanitizedUsers.length
    });

    return {
      status: true,
      message: "Search completed",
      data: sanitizedUsers
    };
  } catch (error) {
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: []
    };
  }
}

module.exports = searchUsers;