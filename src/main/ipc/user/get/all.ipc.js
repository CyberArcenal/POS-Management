//@ts-check
const User = require("../../../../entities/User");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get all users
 * @param {Object} filters
 * @param {number} userId
 */
async function getAllUsers(filters = {}, userId) {
  try {
    const userRepo = AppDataSource.getRepository(User);
    
    // Build query
    const queryBuilder = userRepo
      .createQueryBuilder("user")
      .where("1=1");

    // Apply filters
    // @ts-ignore
    if (filters.is_active !== undefined) {
      queryBuilder.andWhere("user.is_active = :is_active", { 
        // @ts-ignore
        is_active: filters.is_active 
      });
    } else {
      // Default to active users only
      queryBuilder.andWhere("user.is_active = :is_active", { 
        is_active: true 
      });
    }

    // @ts-ignore
    if (filters.role) {
      queryBuilder.andWhere("user.role = :role", { 
        // @ts-ignore
        role: filters.role 
      });
    }

    // @ts-ignore
    if (filters.department) {
      queryBuilder.andWhere("user.department = :department", { 
        // @ts-ignore
        department: filters.department 
      });
    }

    // @ts-ignore
    if (filters.exclude_self && userId) {
      queryBuilder.andWhere("user.id != :userId", { userId });
    }

    // Sort
    queryBuilder.orderBy("user.username", "ASC");

    const users = await queryBuilder.getMany();

    // Remove sensitive data
    const sanitizedUsers = users.map(user => {
      const { ...userData } = user;
      delete userData.password;
      return userData;
    });

    await log_audit("fetch_all", "User", 0, userId, {
      count: sanitizedUsers.length,
      filters
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

module.exports = getAllUsers;