//@ts-check

const User = require("../../../entities/User");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");


/**
 * @param {{ user_id: any; username: any; ip_address: any; user_agent: any; _userId: any; }} params
 * @param {any} qr
 */
async function logUserLogout(params, qr) {
  const { 
    // @ts-ignore
    user_id,
    // @ts-ignore
    username,
    // @ts-ignore
    ip_address,
    // @ts-ignore
    user_agent,
    // @ts-ignore
    _userId 
  } = params;

  try {
    if (!user_id && !username) {
      return {
        status: false,
        message: "User ID or username is required",
        data: null
      };
    }

    let userId = user_id;
    
    // If username is provided but not user_id, look up the user
    if (!user_id && username) {
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({ where: { username } });
      if (user) {
        userId = user.id;
      }
    }

    const activityRepo = AppDataSource.getRepository(UserActivity);

    const activity = activityRepo.create({
      user_id: userId,
      action: "logout",
      entity: "User",
      entity_id: userId,
      ip_address: ip_address || "127.0.0.1",
      user_agent: user_agent || "POS-Management-System",
      details: JSON.stringify({
        logout_time: new Date().toISOString(),
        ip_address: ip_address,
        user_agent: user_agent
      })
    });

    await activityRepo.save(activity);

    return {
      status: true,
      message: "Logout logged successfully",
      data: {
        user_id: userId,
        activity_id: activity.id
      }
    };
  } catch (error) {
    console.error("logUserLogout error:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to log logout: ${error.message}`,
      data: null
    };
  }
}

module.exports = logUserLogout;