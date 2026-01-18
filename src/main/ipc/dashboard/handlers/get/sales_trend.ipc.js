// dashboard/handlers/get/sales_trend.ipc.js
module.exports = async function getSalesTrend(params, queryRunner = null) {
  const { period = 'daily', days = 30 } = params;
  
  const repo = queryRunner ? 
    queryRunner.manager.getRepository("Sale") : 
    require("../../db/dataSource").AppDataSource.getRepository("Sale");
  
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const trend = await repo.createQueryBuilder("sale")
    .select([
      "DATE(sale.datetime) as date",
      "COUNT(*) as transactions",
      "SUM(sale.total) as revenue"
    ])
    .where("sale.status = :status", { status: "completed" })
    .andWhere("sale.datetime >= :start", { start: startDate })
    .groupBy("DATE(sale.datetime)")
    .orderBy("date", "ASC")
    .getRawMany();

  return {
    status: true,
    message: "Sales trend retrieved",
    data: {
      period,
      trend: trend.map(item => ({
        date: item.date,
        transactions: parseInt(item.transactions),
        revenue: parseInt(item.revenue)
      })),
      summary: {
        totalRevenue: trend.reduce((sum, item) => sum + parseInt(item.revenue), 0),
        totalTransactions: trend.reduce((sum, item) => sum + parseInt(item.transactions), 0)
      }
    }
  };
};