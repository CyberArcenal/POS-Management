// @ts-check
const bcrypt = require("bcryptjs");
const User = require("../../../entities/User");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");
const { log_audit } = require("../../../utils/auditLogger");

/**
 * Validate user credentials with transactional UserActivity logging
 * @param {string} username
 * @param {string} password
 * @param {number} actorId
 */
async function validateUserCredentials(username, password, actorId) {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    if (!username || !password) {
      return { status: false, message: "Username and password are required", data: null };
    }

    const userRepo = queryRunner.manager.getRepository(User);
    const activityRepo = queryRunner.manager.getRepository(UserActivity);

    const user = await userRepo.findOne({ where: { username } });

    if (!user) {
      // Audit trail (always recorded)
      await log_audit("login_attempt", "User", 0, actorId, { username, result: "user_not_found" });

      // UserActivity (transactional)
      await activityRepo.save(activityRepo.create({
        user_id: actorId,
        action: "login_attempt",
        description: `Login failed: user '${username}' not found`,
        ip_address: "127.0.0.1",
        user_agent: "POS-Management-System",
      }));

      await queryRunner.commitTransaction();
      return { status: false, message: "Invalid credentials", data: null };
    }

    if (!user.is_active) {
      await log_audit("login_attempt", "User", user.id, actorId, { username, result: "account_inactive" });

      await activityRepo.save(activityRepo.create({
        user_id: user.id,
        action: "login_attempt",
        description: `Login failed: account inactive for '${username}'`,
        ip_address: "127.0.0.1",
        user_agent: "POS-Management-System",
      }));

      await queryRunner.commitTransaction();
      return { status: false, message: "Account is inactive", data: null };
    }

    const isValidPassword = await bcrypt.compare(password, user.password || "");
    if (!isValidPassword) {
      await log_audit("login_attempt", "User", user.id, actorId, { username, result: "invalid_password" });

      await activityRepo.save(activityRepo.create({
        user_id: user.id,
        action: "login_attempt",
        description: `Login failed: invalid password for '${username}'`,
        ip_address: "127.0.0.1",
        user_agent: "POS-Management-System",
      }));

      await queryRunner.commitTransaction();
      return { status: false, message: "Invalid credentials", data: null };
    }

    const { password: _, ...userData } = user;

    await log_audit("login_success", "User", user.id, actorId, { username, role: user.role });

    await activityRepo.save(activityRepo.create({
      user_id: user.id,
      action: "login_success",
      description: `Login successful for '${username}'`,
      ip_address: "127.0.0.1",
      user_agent: "POS-Management-System",
    }));

    await queryRunner.commitTransaction();

    return { status: true, message: "Credentials validated successfully", data: {valid: true, user: userData} };
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error("validateUserCredentials error:", error);
    return { status: false, message: "Internal server error", data: {valid: false, user: null} };
  } finally {
    await queryRunner.release();
  }
}

module.exports = validateUserCredentials;