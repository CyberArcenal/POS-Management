//@ts-check
const Product = require("../../../entities/Product");
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
    const productRepo = AppDataSource.getRepository(Product);

    // Build query - only non-deleted products
    const queryBuilder = productRepo
      .createQueryBuilder("product")
      .where("product.is_deleted = :is_deleted", { is_deleted: false });

    // Apply filters
    // @ts-ignore
    if (filters.category_name) {
      queryBuilder.andWhere("product.category_name = :category_name", {
        // @ts-ignore
        category_name: filters.category_name,
      });
    }

    // @ts-ignore
    if (filters.supplier_name) {
      queryBuilder.andWhere("product.supplier_name = :supplier_name", {
        // @ts-ignore
        supplier_name: filters.supplier_name,
      });
    }

    // @ts-ignore
    if (filters.is_active !== undefined) {
      queryBuilder.andWhere("product.is_active = :is_active", {
        // @ts-ignore
        is_active: filters.is_active,
      });
    }

    // @ts-ignore
    if (filters.min_price !== undefined) {
      queryBuilder.andWhere("product.price >= :min_price", {
        // @ts-ignore
        min_price: filters.min_price,
      });
    }

    // @ts-ignore
    if (filters.max_price !== undefined) {
      queryBuilder.andWhere("product.price <= :max_price", {
        // @ts-ignore
        max_price: filters.max_price,
      });
    }

    // @ts-ignore
    if (filters.low_stock !== undefined && filters.low_stock) {
      queryBuilder.andWhere("product.stock <= product.min_stock");
    }

    // @ts-ignore
    if (filters.out_of_stock !== undefined && filters.out_of_stock) {
      queryBuilder.andWhere("product.stock = 0");
    }

    // @ts-ignore
    if (filters.search) {
      queryBuilder.andWhere(
        "(product.name LIKE :search OR product.sku LIKE :search OR product.barcode LIKE :search OR product.description LIKE :search)",
        // @ts-ignore
        { search: `%${filters.search}%` }
      );
    }

    // @ts-ignore
    if (filters.has_stock_item !== undefined) {
      // @ts-ignore
      if (filters.has_stock_item) {
        queryBuilder.andWhere("product.stock_item_id IS NOT NULL");
      } else {
        queryBuilder.andWhere("product.stock_item_id IS NULL");
      }
    }

    // Sort
    // @ts-ignore
    if (filters.sort_by) {
      // @ts-ignore
      const direction = filters.sort_order === 'desc' ? 'DESC' : 'ASC';
      // @ts-ignore
      queryBuilder.orderBy(`product.${filters.sort_by}`, direction);
    } else {
      queryBuilder.orderBy("product.name", "ASC");
    }

    // ✅ Pagination
    const totalCount = await queryBuilder.getCount();
    const totalPages = Math.ceil(totalCount / pageSize);
    const currentPage = Math.max(1, page);

    const products = await queryBuilder
      .skip((currentPage - 1) * pageSize)
      .take(pageSize)
      .getMany();

    // ✅ Audit log for fetch
    await log_audit("fetch", "Product", 0, userId, {
      filters,
      count: products.length,
      page: currentPage,
      pageSize,
    });

    return {
      status: true,
      message: "Products fetched successfully",
      pagination: {
        count: totalCount,
        current_page: currentPage,
        total_pages: totalPages,
        page_size: pageSize,
        next: currentPage < totalPages,
        previous: currentPage > 1,
      },
      data: products,
    };
  } catch (error) {
    console.error("findPage products error:", error);

    await log_audit("error", "Product", 0, userId, {
      filters,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to fetch products: ${error.message}`,
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