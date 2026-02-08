// src/ipc/product/find_page.ipc.js
// @ts-check
const { Product } = require("../../../entities/Product");
const { AppDataSource } = require("../../db/dataSource");

/**
 * Get paginated products with filters
 * @param {{
 *   page?: number,
 *   pageSize?: number,
 *   filters?: object,
 *   sortBy?: string,
 *   sortOrder?: 'ASC' | 'DESC',
 *   includeDeleted?: boolean
 * }} params
 * @param {number} userId
 */
// @ts-ignore
module.exports = async function findPage(params, userId) {
  const {
    page = 1,
    pageSize = 20,
    filters = {},
    sortBy = 'created_at',
    sortOrder = 'DESC',
    includeDeleted = false
  } = params;
  
  try {
    const productRepo = AppDataSource.getRepository(Product);
    const skip = (page - 1) * pageSize;
    
    // Build query
    const queryBuilder = productRepo.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.supplier', 'supplier');
    
    // Exclude deleted unless specified
    if (!includeDeleted) {
      queryBuilder.where('product.is_deleted = :isDeleted', { isDeleted: false });
    }
    
    // Apply filters
    // @ts-ignore
    if (filters.status) {
      // @ts-ignore
      queryBuilder.andWhere('product.status = :status', { status: filters.status });
    }
    
    // @ts-ignore
    if (filters.is_active !== undefined) {
      // @ts-ignore
      queryBuilder.andWhere('product.is_active = :is_active', { is_active: filters.is_active });
    }
    
    // @ts-ignore
    if (filters.category_id) {
      // @ts-ignore
      queryBuilder.andWhere('product.category_id = :category_id', { category_id: filters.category_id });
    }
    
    // @ts-ignore
    if (filters.brand_id) {
      // @ts-ignore
      queryBuilder.andWhere('product.brand_id = :brand_id', { brand_id: filters.brand_id });
    }
    
    // @ts-ignore
    if (filters.supplier_id) {
      // @ts-ignore
      queryBuilder.andWhere('product.supplier_id = :supplier_id', { supplier_id: filters.supplier_id });
    }
    
    // @ts-ignore
    if (filters.product_type) {
      // @ts-ignore
      queryBuilder.andWhere('product.product_type = :product_type', { product_type: filters.product_type });
    }
    
    // @ts-ignore
    if (filters.min_stock !== undefined) {
      // @ts-ignore
      queryBuilder.andWhere('product.stock >= :min_stock', { min_stock: filters.min_stock });
    }
    
    // @ts-ignore
    if (filters.max_stock !== undefined) {
      // @ts-ignore
      queryBuilder.andWhere('product.stock <= :max_stock', { max_stock: filters.max_stock });
    }
    
    // @ts-ignore
    if (filters.min_price !== undefined) {
      // @ts-ignore
      queryBuilder.andWhere('product.selling_price >= :min_price', { min_price: filters.min_price });
    }
    
    // @ts-ignore
    if (filters.max_price !== undefined) {
      // @ts-ignore
      queryBuilder.andWhere('product.selling_price <= :max_price', { max_price: filters.max_price });
    }
    
    // @ts-ignore
    if (filters.has_expiry !== undefined) {
      // @ts-ignore
      queryBuilder.andWhere('product.has_expiry = :has_expiry', { has_expiry: filters.has_expiry });
    }
    
    // @ts-ignore
    if (filters.is_taxable !== undefined) {
      // @ts-ignore
      queryBuilder.andWhere('product.is_taxable = :is_taxable', { is_taxable: filters.is_taxable });
    }
    
    // @ts-ignore
    if (filters.search) {
      queryBuilder.andWhere(
        '(product.name LIKE :search OR product.sku LIKE :search OR product.barcode LIKE :search OR product.description LIKE :search)',
        // @ts-ignore
        { search: `%${filters.search}%` }
      );
    }
    
    // @ts-ignore
    if (filters.tags && filters.tags.length > 0) {
      // For simple-array field containing comma-separated tags
      // @ts-ignore
      filters.tags.forEach((tag, index) => {
        queryBuilder.andWhere(`product.tags LIKE :tag${index}`, { [`tag${index}`]: `%${tag}%` });
      });
    }
    
    // Get total count
    const total = await queryBuilder.getCount();
    
    // Apply pagination and sorting
    const products = await queryBuilder
      .orderBy(`product.${sortBy}`, sortOrder)
      .skip(skip)
      .take(pageSize)
      .getMany();
    
    // Calculate additional stats
    const stats = {
      total_stock_value: 0,
      total_products: total,
      out_of_stock: 0,
      low_stock: 0,
      by_category: {},
      by_status: {},
    };
    
    products.forEach(product => {
      // Stock value
      if (product.cost_price && product.stock) {
        // @ts-ignore
        stats.total_stock_value += product.cost_price * product.stock;
      }
      
      // Stock status
      // @ts-ignore
      if (product.stock <= 0) stats.out_of_stock++;
      // @ts-ignore
      else if (product.stock <= product.min_stock_level) stats.low_stock++;
      
      // Category distribution
      // @ts-ignore
      if (product.category) {
        // @ts-ignore
        const catName = product.category.name;
        // @ts-ignore
        stats.by_category[catName] = (stats.by_category[catName] || 0) + 1;
      }
      
      // Status distribution
      // @ts-ignore
      stats.by_status[product.status] = (stats.by_status[product.status] || 0) + 1;
    });
    
    return {
      status: true,
      message: "Products retrieved successfully",
      data: {
        products,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
        stats,
      },
    };
    
  } catch (error) {
    console.error("Find page products error:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to retrieve products",
      data: null,
    };
  }
};