//@ts-check
const User = require("../../../../entities/User");
const Sale = require("../../../../entities/Sale");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get user statistics
 * @param {Object} date_range
 * @param {number} userId
 */
async function getUserStats(date_range = {}, userId) {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const saleRepo = AppDataSource.getRepository(Sale);

    // Total users
    const totalUsers = await userRepo.count();
    const activeUsers = await userRepo.count({ where: { is_active: true } });
    const inactiveUsers = await userRepo.count({ where: { is_active: false } });

    // Users by role
    const usersByRole = await userRepo
      .createQueryBuilder("user")
      .select("user.role", "role")
      .addSelect("COUNT(user.id)", "count")
      .groupBy("user.role")
      .getRawMany();

    // Users by department
    const usersByDepartment = await userRepo
      .createQueryBuilder("user")
      .select("user.department", "department")
      .addSelect("COUNT(user.id)", "count")
      .where("user.department IS NOT NULL")
      .groupBy("user.department")
      .getRawMany();

    // Recent sales by users (if date_range provided)
    let recentSales = [];
    // @ts-ignore
    if (date_range.start_date && date_range.end_date) {
      recentSales = await saleRepo
        .createQueryBuilder("sale")
        .select("sale.user_id", "user_id")
        .addSelect("COUNT(sale.id)", "sale_count")
        .addSelect("SUM(sale.total_amount)", "total_sales")
        .where("sale.created_at BETWEEN :start_date AND :end_date", {
          // @ts-ignore
          start_date: date_range.start_date,
          // @ts-ignore
          end_date: date_range.end_date
        })
        .groupBy("sale.user_id")
        .getRawMany();
    }

    // New users this month
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    const newUsersThisMonth = await userRepo
      .createQueryBuilder("user")
      .where("user.created_at >= :firstDayOfMonth", { firstDayOfMonth })
      .getCount();

    await log_audit("fetch_stats", "User", 0, userId, {
      total_users: totalUsers,
      active_users: activeUsers
    });

    return {
      status: true,
      message: "User statistics retrieved successfully",
      data: {
        total_users: totalUsers,
        active_users: activeUsers,
        inactive_users: inactiveUsers,
        users_by_role: usersByRole,
        users_by_department: usersByDepartment,
        recent_sales: recentSales,
        new_users_this_month: newUsersThisMonth
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

module.exports = getUserStats;