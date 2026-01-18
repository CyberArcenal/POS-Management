//@ts-check
const User = require("../../../../entities/User");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get users by role
 * @param {string} role
 * @param {Object} filters
 * @param {number} userId
 */
async function getUsersByRole(role, filters = {}, userId) {
  try {
    if (!role) {
      return {
        status: false,
        message: "Role is required",
        data: []
      };
    }

    const userRepo = AppDataSource.getRepository(User);
    
    const queryBuilder = userRepo
      .createQueryBuilder("user")
      .where("user.role = :role", { role })
      .andWhere("user.is_active = :is_active", { is_active: true });

    // @ts-ignore
    if (filters.department) {
      queryBuilder.andWhere("user.department = :department", { 
        // @ts-ignore
        department: filters.department 
      });
    }

    queryBuilder.orderBy("user.username", "ASC");

    const users = await queryBuilder.getMany();

    // Remove sensitive data
    const sanitizedUsers = users.map(user => {
      const { ...userData } = user;
      delete userData.password;
      return userData;
    });

    await log_audit("fetch_by_role", "User", 0, userId, {
      role: role,
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

module.exports = getUsersByRole;