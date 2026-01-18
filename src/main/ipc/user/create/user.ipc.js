//@ts-check
const bcrypt = require("bcrypt");
const User = require("../../../../entities/User");
const { log_audit } = require("../../../../utils/auditLogger");

/**
 * Create a new user
 * @param {Object} params
 * @param {import("typeorm").QueryRunner} queryRunner
 */
async function createUser(params, queryRunner) {
  const { 
    // @ts-ignore
    username, 
    // @ts-ignore
    password, 
    // @ts-ignore
    role, 
    // @ts-ignore
    first_name, 
    // @ts-ignore
    last_name, 
    // @ts-ignore
    email, 
    // @ts-ignore
    employee_id, 
    // @ts-ignore
    department,
    // @ts-ignore
    can_manage_products,
    // @ts-ignore
    can_adjust_inventory,
    // @ts-ignore
    can_view_reports,
    // @ts-ignore
    _userId 
  } = params;

  try {
    if (!username || !password || !role) {
      return {
        status: false,
        message: "Username, password, and role are required",
        data: null
      };
    }

    const userRepo = queryRunner.manager.getRepository(User);

    // Check if username already exists
    const existingUser = await userRepo.findOne({ where: { username } });
    if (existingUser) {
      return {
        status: false,
        message: "Username already exists",
        data: null
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    // @ts-ignore
    const newUser = userRepo.create({
      username,
      password: hashedPassword,
      role,
      first_name,
      last_name,
      display_name: `${first_name} ${last_name}`.trim(),
      email,
      employee_id,
      department,
      can_manage_products: can_manage_products || false,
      can_adjust_inventory: can_adjust_inventory || false,
      can_view_reports: can_view_reports !== false, // Default to true
      is_active: true
    });

    const savedUser = await userRepo.save(newUser);

    // Remove password from response
    // @ts-ignore
    const { password: _, ...userData } = savedUser;

    // Log activity
    // @ts-ignore
    await log_audit("create", "User", savedUser.id, _userId, {
      // @ts-ignore
      username: savedUser.username,
      // @ts-ignore
      role: savedUser.role
    });

    return {
      status: true,
      message: "User created successfully",
      data: userData
    };
  } catch (error) {
    console.error("createUser error:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to create user: ${error.message}`,
      data: null
    };
  }
}

module.exports = createUser;