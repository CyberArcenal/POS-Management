//@ts-check
const UserActivity = require("../../../../entities/UserActivity");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get user activity logs
 * @param {number} user_id
 * @param {number} userId
 */
async function getUserActivityLogs(user_id, userId) {
  try {
    if (!user_id) {
      return {
        status: false,
        message: "User ID is required",
        data: []
      };
    }

    const activityRepo = AppDataSource.getRepository(UserActivity);
    
    const activities = await activityRepo
      .createQueryBuilder("activity")
      .where("activity.user_id = :user_id", { user_id })
      .orderBy("activity.created_at", "DESC")
      .limit(100)
      .getMany();

    await log_audit("fetch_activity", "UserActivity", user_id, userId, {
      activity_count: activities.length
    });

    return {
      status: true,
      message: "Activity logs retrieved successfully",
      data: activities
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

module.exports = getUserActivityLogs;