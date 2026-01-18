//@ts-check
const UserActivity = require("../../../../entities/UserActivity");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get user login history
 * @param {number} user_id
 * @param {number} userId
 */
async function getUserLoginHistory(user_id, userId) {
  try {
    if (!user_id) {
      return {
        status: false,
        message: "User ID is required",
        data: []
      };
    }

    const activityRepo = AppDataSource.getRepository(UserActivity);
    
    const loginHistory = await activityRepo
      .createQueryBuilder("activity")
      .where("activity.user_id = :user_id", { user_id })
      .andWhere("(activity.action LIKE :login_action OR activity.action LIKE :logout_action)", {
        login_action: '%login%',
        logout_action: '%logout%'
      })
      .orderBy("activity.created_at", "DESC")
      .limit(50)
      .getMany();

    await log_audit("fetch_login_history", "UserActivity", user_id, userId, {
      history_count: loginHistory.length
    });

    return {
      status: true,
      message: "Login history retrieved successfully",
      data: loginHistory
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

module.exports = getUserLoginHistory;