//@ts-check

const User = require("../../../entities/User");
const { AppDataSource } = require("../../db/dataSource");

/**
 * Check username availability
 * @param {string} username
 * @param {number} userId
 */
async function checkUsernameAvailability(username, userId) {
  try {
    if (!username) {
      return {
        status: false,
        message: "Username is required",
        data: null
      };
    }

    const userRepo = AppDataSource.getRepository(User);
    
    const existingUser = await userRepo.findOne({
      where: { username: username }
    });

    return {
      status: true,
      message: existingUser ? "Username already taken" : "Username available",
      data: {
        available: !existingUser,
        username: username
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

module.exports = checkUsernameAvailability;