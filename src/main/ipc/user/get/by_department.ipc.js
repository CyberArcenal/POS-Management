//@ts-check
const User = require("../../../../entities/User");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get users by department
 * @param {string} department
 * @param {number} userId
 */
async function getUsersByDepartment(department, userId) {
  try {
    if (!department) {
      return {
        status: false,
        message: "Department is required",
        data: []
      };
    }

    const userRepo = AppDataSource.getRepository(User);
    
    const users = await userRepo
      .createQueryBuilder("user")
      .where("user.department = :department", { department })
      .andWhere("user.is_active = :is_active", { is_active: true })
      .orderBy("user.username", "ASC")
      .getMany();

    // Remove sensitive data
    const sanitizedUsers = users.map(user => {
      const { ...userData } = user;
      delete userData.password;
      return userData;
    });

    await log_audit("fetch_by_department", "User", 0, userId, {
      department: department,
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

module.exports = getUsersByDepartment;