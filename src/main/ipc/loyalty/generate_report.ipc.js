// src/main/ipc/loyalty/generate_report.ipc.js
//@ts-check

/**
 * Generate a loyalty report (summary and statistics)
 * @param {Object} params
 * @param {string} [params.startDate] - ISO start date
 * @param {string} [params.endDate] - ISO end date
 * @param {string} [params.groupBy] - 'day', 'week', 'month'
 * @param {string} [params.user]
 * @returns {Promise<{status: boolean, message?: string, data?: any}>}
 */
module.exports = async (params) => {
  try {
    // Use statistics endpoint as base, but we can add more reporting logic
    const statisticsHandler = require('./get/statistics.ipc');
    const statsResult = await statisticsHandler();

    if (!statsResult.status) {
      return statsResult;
    }

    // Optionally add date-range filtered data
    let filteredData = null;
    if (params.startDate || params.endDate) {
      const allHandler = require('./get/all.ipc');
      const allResult = await allHandler({
        startDate: params.startDate,
        endDate: params.endDate,
        limit: 1000, // reasonable limit for report
      });
      if (allResult.status) {
        filteredData = allResult.data;
      }
    }

    return {
      status: true,
      data: {
        statistics: statsResult.data,
        filteredTransactions: filteredData,
        reportGeneratedAt: new Date().toISOString(),
        params,
      },
      message: 'Loyalty report generated',
    };
  } catch (error) {
    console.error('Error in generateLoyaltyReport:', error);
    return {
      status: false,
      message: error.message || 'Failed to generate loyalty report',
      data: null,
    };
  }
};