// dashboard/handlers/get/quick_stats.ipc.js
module.exports = async function getQuickStats(params, queryRunner = null) {
  const repo = queryRunner ? 
    queryRunner.manager.getRepository("Sale") : 
    require("../../db/dataSource").AppDataSource.getRepository("Sale");
  
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const todayStats = await repo.createQueryBuilder("sale")
    .select(["COUNT(*) as transactions", "SUM(sale.total) as revenue"])
    .where("sale.status = :status", { status: "completed" })
    .andWhere("sale.datetime >= :start", { start: todayStart })
    .getRawOne();

  return {
    status: true,
    message: "Quick stats retrieved",
    data: {
      todayTransactions: parseInt(todayStats?.transactions) || 0,
      todayRevenue: parseInt(todayStats?.revenue) || 0,
      timestamp: now.toISOString()
    }
  };
};