//@ts-check
const UserActivity = require("../../../../entities/UserActivity");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get user shift information
 * @param {number} user_id
 * @param {number} userId
 */
async function getUserShiftInfo(user_id, userId) {
  try {
    if (!user_id) {
      return {
        status: false,
        message: "User ID is required",
        data: null
      };
    }

    const activityRepo = AppDataSource.getRepository(UserActivity);
    
    // Get today's activities
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayActivities = await activityRepo
      .createQueryBuilder("activity")
      .where("activity.user_id = :user_id", { user_id })
      .andWhere("activity.created_at >= :today", { today })
      .andWhere("(activity.action LIKE :login OR activity.action LIKE :logout)", {
        login: '%login%',
        logout: '%logout%'
      })
      .orderBy("activity.created_at", "ASC")
      .getMany();

    // Find last login and logout
    // @ts-ignore
    const loginActivities = todayActivities.filter(a => a.action.includes('login'));
    // @ts-ignore
    const logoutActivities = todayActivities.filter(a => a.action.includes('logout'));
    
    const lastLogin = loginActivities.length > 0 ? 
      loginActivities[loginActivities.length - 1] : null;
    const lastLogout = logoutActivities.length > 0 ? 
      logoutActivities[logoutActivities.length - 1] : null;

    // Calculate shift duration if currently logged in
    let shiftDuration = null;
    let isCurrentlyLoggedIn = false;

    // @ts-ignore
    if (lastLogin && (!lastLogout || lastLogin.created_at > lastLogout.created_at)) {
      isCurrentlyLoggedIn = true;
      // @ts-ignore
      const startTime = new Date(lastLogin.created_at);
      const currentTime = new Date();
      // @ts-ignore
      shiftDuration = Math.floor((currentTime - startTime) / (1000 * 60)); // in minutes
    }

    await log_audit("fetch_shift_info", "User", user_id, userId, {
      last_login: lastLogin?.created_at,
      last_logout: lastLogout?.created_at,
      currently_logged_in: isCurrentlyLoggedIn
    });

    return {
      status: true,
      message: "Shift information retrieved successfully",
      data: {
        user_id: user_id,
        today_activities: todayActivities,
        last_login: lastLogin,
        last_logout: lastLogout,
        is_currently_logged_in: isCurrentlyLoggedIn,
        shift_duration_minutes: shiftDuration,
        shift_status: isCurrentlyLoggedIn ? 'on_shift' : 'off_shift'
      }
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

module.exports = getUserShiftInfo;