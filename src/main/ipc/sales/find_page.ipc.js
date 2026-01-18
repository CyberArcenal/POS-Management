// sales/find_page.ipc.js
//@ts-check
const Sale = require("../../../entities/Sale");
// @ts-ignore
const SaleItem = require("../../../entities/SaleItem");
// @ts-ignore
const User = require("../../../entities/User");
const { log_audit } = require("../../../utils/auditLogger");
const { AppDataSource } = require("../../db/dataSource");

/**
 * @param {Object} filters
 * @param {number} userId
 * @param {number} page
 * @param {number} pageSize
 */
async function findPage(filters = {}, userId, page = 1, pageSize = 20) {
  try {
    const saleRepo = AppDataSource.getRepository(Sale);

    // Build query
    const queryBuilder = saleRepo
      .createQueryBuilder("sale")
      .leftJoinAndSelect("sale.user", "user")
      .leftJoinAndSelect("sale.items", "items")
      .leftJoinAndSelect("items.product", "product")
      .orderBy("sale.datetime", "DESC");

    // Apply filters
    // @ts-ignore
    if (filters.start_date && filters.end_date) {
      queryBuilder.andWhere("sale.datetime BETWEEN :start_date AND :end_date", {
        // @ts-ignore
        start_date: filters.start_date,
        // @ts-ignore
        end_date: filters.end_date,
      });
    }

    // @ts-ignore
    if (filters.user_id) {
      queryBuilder.andWhere("sale.user_id = :user_id", {
        // @ts-ignore
        user_id: filters.user_id,
      });
    }

    // @ts-ignore
    if (filters.status) {
      queryBuilder.andWhere("sale.status = :status", {
        // @ts-ignore
        status: filters.status,
      });
    }

    // @ts-ignore
    if (filters.payment_method) {
      queryBuilder.andWhere("sale.payment_method = :payment_method", {
        // @ts-ignore
        payment_method: filters.payment_method,
      });
    }

    // @ts-ignore
    if (filters.min_total !== undefined) {
      queryBuilder.andWhere("sale.total >= :min_total", {
        // @ts-ignore
        min_total: filters.min_total,
      });
    }

    // @ts-ignore
    if (filters.max_total !== undefined) {
      queryBuilder.andWhere("sale.total <= :max_total", {
        // @ts-ignore
        max_total: filters.max_total,
      });
    }

    // @ts-ignore
    if (filters.reference_number) {
      queryBuilder.andWhere("sale.reference_number LIKE :reference_number", {
        // @ts-ignore
        reference_number: `%${filters.reference_number}%`,
      });
    }

    // @ts-ignore
    if (filters.customer_name) {
      queryBuilder.andWhere("sale.customer_name LIKE :customer_name", {
        // @ts-ignore
        customer_name: `%${filters.customer_name}%`,
      });
    }

    // Search across multiple fields
    // @ts-ignore
    if (filters.search) {
      queryBuilder.andWhere(
        "(sale.reference_number LIKE :search OR user.username LIKE :search OR sale.customer_name LIKE :search OR sale.customer_phone LIKE :search)",
        // @ts-ignore
        { search: `%${filters.search}%` }
      );
    }

    // ✅ Pagination
    const totalCount = await queryBuilder.getCount();
    const totalPages = Math.ceil(totalCount / pageSize);
    const currentPage = Math.max(1, page);

    const sales = await queryBuilder
      .skip((currentPage - 1) * pageSize)
      .take(pageSize)
      .getMany();

    // Calculate summary stats
    const summaryQuery = saleRepo.createQueryBuilder("sale");
    
    // @ts-ignore
    if (filters.start_date && filters.end_date) {
      summaryQuery.where("sale.datetime BETWEEN :start_date AND :end_date", {
        // @ts-ignore
        start_date: filters.start_date,
        // @ts-ignore
        end_date: filters.end_date,
      });
    }

    const summary = await summaryQuery
      .select([
        "COUNT(sale.id) as total_sales",
        "SUM(sale.total) as total_revenue",
        "SUM(sale.discount_amount) as total_discount",
        "SUM(sale.tax_amount) as total_tax",
      ])
      .getRawOne();

    // ✅ Audit log for fetch
    await log_audit("fetch", "Sale", 0, userId, {
      filters,
      count: sales.length,
      page: currentPage,
      pageSize,
    });

    return {
      status: true,
      message: "Sales fetched successfully",
      pagination: {
        count: totalCount,
        current_page: currentPage,
        total_pages: totalPages,
        page_size: pageSize,
        next: currentPage < totalPages,
        previous: currentPage > 1,
      },
      summary: {
        total_sales: parseInt(summary.total_sales) || 0,
        total_revenue: parseInt(summary.total_revenue) || 0,
        total_discount: parseInt(summary.total_discount) || 0,
        total_tax: parseInt(summary.total_tax) || 0,
      },
      data: sales,
    };
  } catch (error) {
    console.error("findPage sales error:", error);

    await log_audit("error", "Sale", 0, userId, {
      filters,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to fetch sales: ${error.message}`,
      pagination: {
        count: 0,
        current_page: 1,
        total_pages: 0,
        page_size: pageSize,
        next: false,
        previous: false,
      },
      summary: {
        total_sales: 0,
        total_revenue: 0,
        total_discount: 0,
        total_tax: 0,
      },
      data: [],
    };
  }
}

module.exports = findPage;