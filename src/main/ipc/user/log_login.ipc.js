//@ts-check

const User = require("../../../entities/User");
const UserActivity = require("../../../entities/UserActivity");

/**
 * Log user login
 * @param {Object} params
 * @param {import("typeorm").QueryRunner} queryRunner
 */
async function logUserLogin(params, queryRunner) {
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
      const userRepo = queryRunner.manager.getRepository(User);
      const user = await userRepo.findOne({ where: { username } });
      if (user) {
        userId = user.id;
      }
    }

    const activityRepo = queryRunner.manager.getRepository(UserActivity);

    const activity = activityRepo.create({
      user_id: userId,
      action: "login",
      entity: "User",
      entity_id: userId,
      ip_address: ip_address || "127.0.0.1",
      user_agent: user_agent || "POS-Management-System",
      details: JSON.stringify({
        login_time: new Date().toISOString(),
        ip_address: ip_address,
        user_agent: user_agent
      })
    });

    await activityRepo.save(activity);

    // Also update last_login_at in User table
    if (userId) {
      const userRepo = queryRunner.manager.getRepository(User);
      await userRepo.update(userId, {
        last_login_at: new Date()
      });
    }

    return {
      status: true,
      message: "Login logged successfully",
      data: {
        user_id: userId,
        activity_id: activity.id
      }
    };
  } catch (error) {
    console.error("logUserLogin error:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to log login: ${error.message}`,
      data: null
    };
  }
}

module.exports = logUserLogin;