// src/main/ipc/loyalty/get/all.ipc.js
//@ts-check
const { AppDataSource } = require("../../../db/datasource");
const LoyaltyTransaction = require("../../../../entities/LoyaltyTransaction");

/**
 * Get all loyalty transactions with optional filtering and pagination
 * @param {Object} params - Filter and pagination parameters
 * @param {number} [params.page] - Page number (1-based)
 * @param {number} [params.limit] - Items per page
 * @param {string} [params.sortBy] - Field to sort by (e.g., 'timestamp')
 * @param {'ASC'|'DESC'} [params.sortOrder] - Sort order
 * @param {number} [params.customerId] - Filter by customer ID
 * @param {number} [params.saleId] - Filter by sale ID
 * @param {string} [params.startDate] - ISO date string for start of range
 * @param {string} [params.endDate] - ISO date string for end of range
 * @param {'earn'|'redeem'} [params.type] - Filter by transaction type
 * @param {string} [params.search] - Search in notes
 * @returns {Promise<{status: boolean, message?: string, data?: any}>}
 */
module.exports = async (params) => {
  try {
    const txRepo = AppDataSource.getRepository(LoyaltyTransaction);
    const queryBuilder = txRepo
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.customer', 'customer')
      .leftJoinAndSelect('tx.sale', 'sale');

    // Apply filters
    if (params.customerId) {
      queryBuilder.andWhere('tx.customerId = :customerId', { customerId: params.customerId });
    }
    if (params.saleId) {
      queryBuilder.andWhere('tx.saleId = :saleId', { saleId: params.saleId });
    }
    if (params.startDate) {
      queryBuilder.andWhere('tx.timestamp >= :startDate', { startDate: params.startDate });
    }
    if (params.endDate) {
      queryBuilder.andWhere('tx.timestamp <= :endDate', { endDate: params.endDate });
    }
    if (params.type === 'earn') {
      queryBuilder.andWhere('tx.pointsChange > 0');
    } else if (params.type === 'redeem') {
      queryBuilder.andWhere('tx.pointsChange < 0');
    }
    if (params.search) {
      queryBuilder.andWhere('tx.notes LIKE :search', { search: `%${params.search}%` });
    }

    // Sorting
    const sortBy = params.sortBy || 'timestamp';
    const sortOrder = params.sortOrder === 'ASC' ? 'ASC' : 'DESC';
    queryBuilder.orderBy(`tx.${sortBy}`, sortOrder);

    // Pagination
    if (params.page && params.limit) {
      const skip = (params.page - 1) * params.limit;
      queryBuilder.skip(skip).take(params.limit);
    }

    const transactions = await queryBuilder.getMany();

    return {
      status: true,
      data: transactions,
    };
  } catch (error) {
    console.error('Error in getAllLoyaltyTransactions:', error);
    return {
      status: false,
      message: error.message || 'Failed to fetch loyalty transactions',
      data: null,
    };
  }
};