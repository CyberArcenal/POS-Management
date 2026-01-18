//@ts-check
const User = require("../../../../entities/User");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get active users
 * @param {boolean} include_inactive
 * @param {number} userId
 */
async function getActiveUsers(include_inactive = false, userId) {
  try {
    const userRepo = AppDataSource.getRepository(User);
    
    const queryBuilder = userRepo
      .createQueryBuilder("user");

    if (!include_inactive) {
      queryBuilder.where("user.is_active = :is_active", { is_active: true });
    }

    queryBuilder.orderBy("user.username", "ASC");

    const users = await queryBuilder.getMany();

    // Remove sensitive data
    const sanitizedUsers = users.map(user => {
      const { ...userData } = user;
      delete userData.password;
      return userData;
    });

    await log_audit("fetch_active", "User", 0, userId, {
      include_inactive: include_inactive,
      count: sanitizedUsers.length
    });

    return {
      status: true,
      message: "Users retrieved successfully",
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

module.exports = getActiveUsers;