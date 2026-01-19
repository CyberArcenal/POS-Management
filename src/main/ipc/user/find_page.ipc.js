//@ts-check
const User = require("../../../entities/User");
const { log_audit } = require("../../../utils/auditLogger");
const { AppDataSource } = require("../../db/dataSource");

/**
 * @param {Object} filters
 * @param {number} userId
 * @param {number} page
 * @param {number} pageSize
 */
async function findPage(filters = {}, userId, page = 1, pageSize = 10) {
  try {
    const userRepo = AppDataSource.getRepository(User);

    // Build query - only active users by default
    const queryBuilder = userRepo
      .createQueryBuilder("user")
      .where("1=1"); // Start with true condition

    // Apply filters
    // @ts-ignore
    if (filters.role) {
      queryBuilder.andWhere("user.role = :role", {
        // @ts-ignore
        role: filters.role,
      });
    }

    // @ts-ignore
    if (filters.department) {
      queryBuilder.andWhere("user.department = :department", {
        // @ts-ignore
        department: filters.department,
      });
    }

    // @ts-ignore
    if (filters.is_active !== undefined) {
      queryBuilder.andWhere("user.is_active = :is_active", {
        // @ts-ignore
        is_active: filters.is_active,
      });
    } else {
      // Default to active users only
      queryBuilder.andWhere("user.is_active = :is_active", {
        is_active: true,
      });
    }

    // @ts-ignore
    if (filters.can_manage_products !== undefined) {
      queryBuilder.andWhere("user.can_manage_products = :can_manage_products", {
        // @ts-ignore
        can_manage_products: filters.can_manage_products,
      });
    }

    // @ts-ignore
    if (filters.can_adjust_inventory !== undefined) {
      queryBuilder.andWhere("user.can_adjust_inventory = :can_adjust_inventory", {
        // @ts-ignore
        can_adjust_inventory: filters.can_adjust_inventory,
      });
    }

    // @ts-ignore
    if (filters.search) {
      queryBuilder.andWhere(
        "(user.username LIKE :search OR user.first_name LIKE :search OR user.last_name LIKE :search OR user.email LIKE :search OR user.employee_id LIKE :search)",
        // @ts-ignore
        { search: `%${filters.search}%` }
      );
    }

    // Exclude current user from search if requested
    // @ts-ignore
    if (filters.exclude_self && userId) {
      queryBuilder.andWhere("user.id != :userId", { userId });
    }

    // Sort
    // @ts-ignore
    if (filters.sort_by) {
      // @ts-ignore
      const direction = filters.sort_order === 'desc' ? 'DESC' : 'ASC';
      // @ts-ignore
      queryBuilder.orderBy(`user.${filters.sort_by}`, direction);
    } else {
      queryBuilder.orderBy("user.username", "ASC");
    }

    // ✅ Pagination
    const totalCount = await queryBuilder.getCount();
    const totalPages = Math.ceil(totalCount / pageSize);
    const currentPage = Math.max(1, page);

    const users = await queryBuilder
      .skip((currentPage - 1) * pageSize)
      .take(pageSize)
      .getMany();

    // Remove sensitive data
    const sanitizedUsers = users.map((/** @type {{ [x: string]: any; }} */ user) => {
      const { ...userData } = user;
      // Remove password field if it exists
      // @ts-ignore
      delete userData.password;
      return userData;
    });

    // ✅ Audit log for fetch
    await log_audit("fetch", "User", 0, userId, {
      filters,
      count: sanitizedUsers.length,
      page: currentPage,
      pageSize,
    });

    return {
      status: true,
      message: "Users fetched successfully",
      pagination: {
        count: totalCount,
        current_page: currentPage,
        total_pages: totalPages,
        page_size: pageSize,
        next: currentPage < totalPages,
        previous: currentPage > 1,
      },
      data: sanitizedUsers,
    };
  } catch (error) {
    console.error("findPage users error:", error);

    await log_audit("error", "User", 0, userId, {
      filters,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to fetch users: ${error.message}`,
      pagination: {
        count: 0,
        current_page: 1,
        total_pages: 0,
        page_size: pageSize,
        next: false,
        previous: false,
      },
      data: [],
    };
  }
}

module.exports = findPage;