// src/ipc/category/category.ipc.js - Complete Category Handler
// @ts-check
const { ipcMain } = require("electron");
const { withErrorHandling } = require("../../../utils/errorHandler");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/dataSource");
const { Product } = require("../../../entities/Product");
const Category = require("../../../entities/Category");

class CategoryHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // ✅ CRUD OPERATIONS
    this.createCategory = this.createCategory.bind(this);
    this.updateCategory = this.updateCategory.bind(this);
    this.deleteCategory = this.deleteCategory.bind(this);
    this.getCategoryById = this.getCategoryById.bind(this);
    
    // ✅ HIERARCHICAL OPERATIONS
    this.getCategoryTree = this.getCategoryTree.bind(this);
    this.getSubcategories = this.getSubcategories.bind(this);
    this.moveCategory = this.moveCategory.bind(this);
    
    // ✅ READ-ONLY HANDLERS
    this.getAllCategories = this.getAllCategories.bind(this);
    this.searchCategories = this.searchCategories.bind(this);
    this.getActiveCategories = this.getActiveCategories.bind(this);
    this.getCategoriesWithProductCount = this.getCategoriesWithProductCount.bind(this);
  }

  /**
   * Create a new category
   * @param {{ categoryData: object, _userId: number }} params
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  // @ts-ignore
  async createCategory(params, queryRunner = null) {
    const { categoryData, _userId } = params;
    
    try {
      const categoryRepo = queryRunner 
        ? queryRunner.manager.getRepository(Category)
        : AppDataSource.getRepository(Category);
      
      // Validate required fields
      // @ts-ignore
      if (!categoryData.name) {
        return {
          status: false,
          message: "Category name is required",
          data: null,
        };
      }
      
      // Check if category name already exists under same parent
      const existingCategory = await categoryRepo.findOne({
        where: { 
          // @ts-ignore
          name: categoryData.name,
          // @ts-ignore
          parent_id: categoryData.parent_id || null,
          is_active: true 
        },
      });
      
      if (existingCategory) {
        // @ts-ignore
        const parentInfo = categoryData.parent_id ? ` under parent ID ${categoryData.parent_id}` : ' (root level)';
        return {
          status: false,
          // @ts-ignore
          message: `Category with name "${categoryData.name}" already exists${parentInfo}`,
          data: null,
        };
      }
      
      // Validate parent exists if provided
      // @ts-ignore
      if (categoryData.parent_id) {
        const parentCategory = await categoryRepo.findOne({
          // @ts-ignore
          where: { id: categoryData.parent_id, is_active: true },
        });
        
        if (!parentCategory) {
          return {
            status: false,
            // @ts-ignore
            message: `Parent category with ID ${categoryData.parent_id} not found`,
            data: null,
          };
        }
        
        // Prevent circular reference (category as its own parent)
        // @ts-ignore
        if (categoryData.parent_id === categoryData.id) {
          return {
            status: false,
            message: "Category cannot be its own parent",
            data: null,
          };
        }
      }
      
      // Calculate next sort order
      const lastSortOrder = await categoryRepo
        .createQueryBuilder('category')
        .select('MAX(category.sort_order)', 'max')
        .where('category.parent_id = :parentId', { 
          // @ts-ignore
          parentId: categoryData.parent_id || null 
        })
        .andWhere('category.is_active = :isActive', { isActive: true })
        .getRawOne();
      
      const nextSortOrder = (lastSortOrder.max || 0) + 1;
      
      // Create new category
      const category = categoryRepo.create({
        ...categoryData,
        // @ts-ignore
        sort_order: categoryData.sort_order || nextSortOrder,
        is_active: true,
      });
      
      const savedCategory = await categoryRepo.save(category);
      
      // Log activity
      if (_userId) {
        const activityRepo = queryRunner 
          ? queryRunner.manager.getRepository(require("../../../entities/UserActivity"))
          : AppDataSource.getRepository(require("../../../entities/UserActivity"));
        
        await activityRepo.save({
          user_id: _userId,
          action: "category_create",
          entity: "Category",
          entity_id: savedCategory.id,
          // @ts-ignore
          description: `Created category: ${savedCategory.name}${categoryData.parent_id ? ` (Child of ID ${categoryData.parent_id})` : ''}`,
        });
      }
      
      return {
        status: true,
        message: "Category created successfully",
        data: savedCategory,
      };
      
    } catch (error) {
      console.error("Create category error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to create category",
        data: null,
      };
    }
  }

  /**
   * Update existing category
   * @param {{ categoryId: number, categoryData: object, _userId: number }} params
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  // @ts-ignore
  async updateCategory(params, queryRunner = null) {
    const { categoryId, categoryData, _userId } = params;
    
    try {
      const categoryRepo = queryRunner 
        ? queryRunner.manager.getRepository(Category)
        : AppDataSource.getRepository(Category);
      
      // Find category
      const category = await categoryRepo.findOne({
        where: { id: categoryId, is_active: true },
        relations: ['parent']
      });
      
      if (!category) {
        return {
          status: false,
          message: `Category with ID ${categoryId} not found`,
          data: null,
        };
      }
      
      // Check if moving to a new parent
      // @ts-ignore
      if (categoryData.parent_id !== undefined && categoryData.parent_id !== category.parent_id) {
        // Prevent circular reference
        // @ts-ignore
        if (categoryData.parent_id === categoryId) {
          return {
            status: false,
            message: "Category cannot be its own parent",
            data: null,
          };
        }
        
        // Check if parent exists and is active
        // @ts-ignore
        if (categoryData.parent_id !== null) {
          const newParent = await categoryRepo.findOne({
            // @ts-ignore
            where: { id: categoryData.parent_id, is_active: true },
          });
          
          if (!newParent) {
            return {
              status: false,
              // @ts-ignore
              message: `Parent category with ID ${categoryData.parent_id} not found`,
              data: null,
            };
          }
          
          // Check for circular reference in hierarchy
          // @ts-ignore
          if (await this.isCircularReference(categoryId, categoryData.parent_id, categoryRepo)) {
            return {
              status: false,
              message: "Circular reference detected in category hierarchy",
              data: null,
            };
          }
        }
        
        // Recalculate sort order for new parent
        const lastSortOrder = await categoryRepo
          .createQueryBuilder('category')
          .select('MAX(category.sort_order)', 'max')
          .where('category.parent_id = :parentId', { 
            // @ts-ignore
            parentId: categoryData.parent_id || null 
          })
          .andWhere('category.is_active = :isActive', { isActive: true })
          .getRawOne();
        
        // @ts-ignore
        categoryData.sort_order = categoryData.sort_order || (lastSortOrder.max || 0) + 1;
      }
      
      // Check name uniqueness under same parent
      // @ts-ignore
      if (categoryData.name && categoryData.name !== category.name) {
        // @ts-ignore
        const parentId = categoryData.parent_id !== undefined ? categoryData.parent_id : category.parent_id;
        
        const existingCategory = await categoryRepo.findOne({
          where: { 
            // @ts-ignore
            name: categoryData.name,
            parent_id: parentId || null,
            is_active: true,
            id: { $not: categoryId }
          },
        });
        
        if (existingCategory) {
          const parentInfo = parentId ? ` under parent ID ${parentId}` : ' (root level)';
          return {
            status: false,
            // @ts-ignore
            message: `Category with name "${categoryData.name}" already exists${parentInfo}`,
            data: null,
          };
        }
      }
      
      // Update category
      Object.assign(category, categoryData);
      category.updated_at = new Date();
      
      const updatedCategory = await categoryRepo.save(category);
      
      // Log activity
      if (_userId) {
        const activityRepo = queryRunner 
          ? queryRunner.manager.getRepository(require("../../../entities/UserActivity"))
          : AppDataSource.getRepository(require("../../../entities/UserActivity"));
        
        await activityRepo.save({
          user_id: _userId,
          action: "category_update",
          entity: "Category",
          entity_id: updatedCategory.id,
          description: `Updated category: ${updatedCategory.name}`,
        });
      }
      
      return {
        status: true,
        message: "Category updated successfully",
        data: updatedCategory,
      };
      
    } catch (error) {
      console.error("Update category error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to update category",
        data: null,
      };
    }
  }


  /**
     * @param {number} categoryId
     * @param {number} newParentId
     * @param {import("typeorm").Repository<{ id: unknown; name: unknown; description: unknown; parent_id: unknown; sort_order: unknown; image_url: unknown; is_active: unknown; created_at: unknown; updated_at: unknown; }>} categoryRepo
     */
  async isCircularReference(categoryId, newParentId, categoryRepo) {
    let currentParentId = newParentId;
    const visited = new Set([categoryId]);
    
    while (currentParentId !== null) {
      if (visited.has(currentParentId)) {
        return true; // Circular reference detected
      }
      
      visited.add(currentParentId);
      
      const parent = await categoryRepo.findOne({
        where: { id: currentParentId, is_active: true },
        select: ['id', 'parent_id']
      });
      
      if (!parent) break;
      
      // @ts-ignore
      currentParentId = parent.parent_id;
    }
    
    return false;
  }

  /**
   * Soft delete category (set is_active to false)
   * @param {{ categoryId: number, deleteChildren: boolean, _userId: number }} params
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  // @ts-ignore
  async deleteCategory(params, queryRunner = null) {
    const { categoryId, deleteChildren = false, _userId } = params;
    
    try {
      const categoryRepo = queryRunner 
        ? queryRunner.manager.getRepository(Category)
        : AppDataSource.getRepository(Category);
      
      // Find category with children
      const category = await categoryRepo.findOne({
        where: { id: categoryId, is_active: true },
        relations: ['children']
      });
      
      if (!category) {
        return {
          status: false,
          message: `Category with ID ${categoryId} not found`,
          data: null,
        };
      }
      
      // Check if category has subcategories
      // @ts-ignore
      if (category.children && category.children.length > 0 && !deleteChildren) {
        return {
          status: false,
          // @ts-ignore
          message: `Category has ${category.children.length} subcategory(s). Set deleteChildren=true to delete them all.`,
          // @ts-ignore
          data: { subcategoryCount: category.children.length },
        };
      }
      
      // Check if category has associated products
      const productRepo = queryRunner 
        ? queryRunner.manager.getRepository(Product)
        : AppDataSource.getRepository(Product);
      
      const productCount = await productRepo.count({
        where: { 
          category_id: categoryId,
          is_deleted: false 
        },
      });
      
      if (productCount > 0) {
        return {
          status: false,
          message: `Cannot delete category. ${productCount} product(s) are associated with this category.`,
          data: null,
        };
      }
      
      // Delete category and its children if requested
      await this.deleteCategoryRecursive(categoryId, deleteChildren, categoryRepo);
      
      // Log activity
      if (_userId) {
        const activityRepo = queryRunner 
          ? queryRunner.manager.getRepository(require("../../../entities/UserActivity"))
          : AppDataSource.getRepository(require("../../../entities/UserActivity"));
        
        await activityRepo.save({
          user_id: _userId,
          action: "category_delete",
          entity: "Category",
          entity_id: categoryId,
          description: `Deleted category: ${category.name}${deleteChildren ? ' with all subcategories' : ''}`,
        });
      }
      
      return {
        status: true,
        message: `Category deleted successfully${deleteChildren ? ' with all subcategories' : ''}`,
        data: { id: categoryId },
      };
      
    } catch (error) {
      console.error("Delete category error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to delete category",
        data: null,
      };
    }
  }

  
  /**
     * @param {number} categoryId
     * @param {boolean} deleteChildren
     * @param {import("typeorm").Repository<{ id: unknown; name: unknown; description: unknown; parent_id: unknown; sort_order: unknown; image_url: unknown; is_active: unknown; created_at: unknown; updated_at: unknown; }>} categoryRepo
     */
  async deleteCategoryRecursive(categoryId, deleteChildren, categoryRepo) {
    if (deleteChildren) {
      // Get all children
      const children = await categoryRepo.find({
        where: { parent_id: categoryId, is_active: true }
      });
      
      // Recursively delete children
      for (const child of children) {
        // @ts-ignore
        await this.deleteCategoryRecursive(child.id, true, categoryRepo);
      }
    }
    
    // Soft delete the category
    await categoryRepo.update(categoryId, {
      is_active: false,
      updated_at: new Date()
    });
  }

  /**
   * Get category by ID with full hierarchy
   * @param {{ categoryId: number, includeProducts: boolean, _userId: number }} params
   */
  async getCategoryById(params) {
    // @ts-ignore
    const { categoryId, includeProducts = false, _userId } = params;
    
    try {
      const categoryRepo = AppDataSource.getRepository(Category);
      
      // Build query
      const queryBuilder = categoryRepo
        .createQueryBuilder('category')
        .leftJoinAndSelect('category.parent', 'parent')
        .leftJoinAndSelect('category.children', 'children')
        .where('category.id = :id', { id: categoryId })
        .andWhere('category.is_active = :isActive', { isActive: true })
        .orderBy('children.sort_order', 'ASC');
      
      // Include products if requested
      if (includeProducts) {
        queryBuilder
          .leftJoinAndSelect('category.products', 'products')
          .andWhere('products.is_deleted = :notDeleted', { notDeleted: false })
          .addOrderBy('products.name', 'ASC');
      }
      
      const category = await queryBuilder.getOne();
      
      if (!category) {
        return {
          status: false,
          message: `Category with ID ${categoryId} not found`,
          data: null,
        };
      }
      
      return {
        status: true,
        message: "Category retrieved successfully",
        data: category,
      };
      
    } catch (error) {
      console.error("Get category by ID error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to retrieve category",
        data: null,
      };
    }
  }

  /**
   * Get full category tree hierarchy
   * @param {{ includeProductCount: boolean, _userId: number }} params
   */
  async getCategoryTree(params) {
    // @ts-ignore
    const { includeProductCount = false, _userId } = params;
    
    try {
      const categoryRepo = AppDataSource.getRepository(Category);
      
      // Get all active categories
      const categories = await categoryRepo
        .createQueryBuilder('category')
        .where('category.is_active = :isActive', { isActive: true })
        .orderBy('category.parent_id', 'ASC')
        .addOrderBy('category.sort_order', 'ASC')
        .getMany();
      
      // Build tree structure
      const categoryMap = new Map();
      // @ts-ignore
      const rootCategories = [];
      
      // Initialize map
      categories.forEach(category => {
        // @ts-ignore
        category.children = [];
        categoryMap.set(category.id, category);
      });
      
      // Build hierarchy
      categories.forEach(category => {
        if (category.parent_id) {
          const parent = categoryMap.get(category.parent_id);
          if (parent) {
            parent.children.push(category);
          } else {
            // Parent not found or inactive, treat as root
            rootCategories.push(category);
          }
        } else {
          rootCategories.push(category);
        }
      });
      
      // Get product counts if requested
      if (includeProductCount) {
        const productRepo = AppDataSource.getRepository(Product);
        
        for (const category of categories) {
          const productCount = await productRepo.count({
            // @ts-ignore
            where: { 
              category_id: category.id,
              is_deleted: false 
            },
          });
          
          // @ts-ignore
          category.productCount = productCount;
          
          // Also count products in subcategories
          // @ts-ignore
          const subcategoryIds = await this.getSubcategoryIds(category.id, categoryRepo);
          if (subcategoryIds.length > 0) {
            const totalProductCount = await productRepo.count({
              where: { 
                category_id: { $in: subcategoryIds },
                is_deleted: false 
              },
            });
            // @ts-ignore
            category.totalProductCount = productCount + totalProductCount;
          } else {
            // @ts-ignore
            category.totalProductCount = productCount;
          }
        }
      }
      
      return {
        status: true,
        message: "Category tree retrieved successfully",
        // @ts-ignore
        data: rootCategories,
      };
      
    } catch (error) {
      console.error("Get category tree error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to retrieve category tree",
        data: null,
      };
    }
  }

 
  /**
     * @param {unknown} categoryId
     * @param {import("typeorm").Repository<{ id: unknown; name: unknown; description: unknown; parent_id: unknown; sort_order: unknown; image_url: unknown; is_active: unknown; created_at: unknown; updated_at: unknown; }>} categoryRepo
     */
  async getSubcategoryIds(categoryId, categoryRepo) {
    // @ts-ignore
    const subcategoryIds = [];
    const stack = [categoryId];
    
    while (stack.length > 0) {
      const currentId = stack.pop();
      const children = await categoryRepo.find({
        // @ts-ignore
        where: { parent_id: currentId, is_active: true },
        select: ['id']
      });
      
      children.forEach((/** @type {{ id: any; }} */ child) => {
        subcategoryIds.push(child.id);
        stack.push(child.id);
      });
    }
    
    // @ts-ignore
    return subcategoryIds;
  }

  /**
   * Get direct subcategories of a category
   * @param {{ parentId: number | null, _userId: number }} params
   */
  async getSubcategories(params) {
    // @ts-ignore
    const { parentId = null, _userId } = params;
    
    try {
      const categoryRepo = AppDataSource.getRepository(Category);
      
      const subcategories = await categoryRepo
        .createQueryBuilder('category')
        .where('category.parent_id = :parentId', { parentId })
        .andWhere('category.is_active = :isActive', { isActive: true })
        .orderBy('category.sort_order', 'ASC')
        .getMany();
      
      return {
        status: true,
        message: parentId === null ? "Root categories retrieved" : "Subcategories retrieved",
        data: subcategories,
      };
      
    } catch (error) {
      console.error("Get subcategories error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to retrieve subcategories",
        data: null,
      };
    }
  }

  /**
   * Move category to new position or parent
   * @param {{ categoryId: number, newParentId: number | null, newSortOrder: number, _userId: number }} params
   * @param {import("typeorm").QueryRunner} [queryRunner]
   */
  // @ts-ignore
  async moveCategory(params, queryRunner = null) {
    const { categoryId, newParentId = null, newSortOrder, _userId } = params;
    
    try {
      const categoryRepo = queryRunner 
        ? queryRunner.manager.getRepository(Category)
        : AppDataSource.getRepository(Category);
      
      // Get category
      const category = await categoryRepo.findOne({
        where: { id: categoryId, is_active: true }
      });
      
      if (!category) {
        return {
          status: false,
          message: `Category with ID ${categoryId} not found`,
          data: null,
        };
      }
      
      // Check if parent exists
      if (newParentId !== null) {
        const parentCategory = await categoryRepo.findOne({
          where: { id: newParentId, is_active: true }
        });
        
        if (!parentCategory) {
          return {
            status: false,
            message: `Parent category with ID ${newParentId} not found`,
            data: null,
          };
        }
        
        // Prevent circular reference
        if (newParentId === categoryId) {
          return {
            status: false,
            message: "Category cannot be its own parent",
            data: null,
          };
        }
        
        if (await this.isCircularReference(categoryId, newParentId, categoryRepo)) {
          return {
            status: false,
            message: "Circular reference detected in category hierarchy",
            data: null,
          };
        }
      }
      
      // Get current siblings to adjust sort orders
      const siblings = await categoryRepo
        .createQueryBuilder('category')
        .where('category.parent_id = :parentId', { parentId: newParentId })
        .andWhere('category.id != :categoryId', { categoryId })
        .andWhere('category.is_active = :isActive', { isActive: true })
        .orderBy('category.sort_order', 'ASC')
        .getMany();
      
      // Adjust sort orders
      const updatedSiblings = [];
      let currentOrder = 1;
      
      for (let i = 0; i < siblings.length; i++) {
        if (currentOrder === newSortOrder) {
          currentOrder++; // Skip the spot for our moved category
        }
        
        if (siblings[i].sort_order !== currentOrder) {
          siblings[i].sort_order = currentOrder;
          updatedSiblings.push(siblings[i]);
        }
        currentOrder++;
      }
      
      // Update moved category
      category.parent_id = newParentId;
      category.sort_order = newSortOrder;
      category.updated_at = new Date();
      
      // Save all changes
      if (updatedSiblings.length > 0) {
        await categoryRepo.save(updatedSiblings);
      }
      const updatedCategory = await categoryRepo.save(category);
      
      // Log activity
      if (_userId) {
        const activityRepo = queryRunner 
          ? queryRunner.manager.getRepository(require("../../../entities/UserActivity"))
          : AppDataSource.getRepository(require("../../../entities/UserActivity"));
        
        await activityRepo.save({
          user_id: _userId,
          action: "category_move",
          entity: "Category",
          entity_id: categoryId,
          description: `Moved category ${category.name} to parent ${newParentId || 'root'} at position ${newSortOrder}`,
        });
      }
      
      return {
        status: true,
        message: "Category moved successfully",
        data: updatedCategory,
      };
      
    } catch (error) {
      console.error("Move category error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to move category",
        data: null,
      };
    }
  }

  /**
   * Get all categories with pagination
   * @param {{ 
   *   page?: number, 
   *   limit?: number, 
   *   parentId?: number | null,
   *   sortBy?: string, 
   *   sortOrder?: 'ASC' | 'DESC',
   *   _userId: number 
   * }} params
   */
  async getAllCategories(params) {
    const { 
      page = 1, 
      limit = 20, 
      parentId = undefined,
      sortBy = 'sort_order', 
      sortOrder = 'ASC',
      // @ts-ignore
      _userId 
    } = params;
    
    try {
      const categoryRepo = AppDataSource.getRepository(Category);
      const skip = (page - 1) * limit;
      
      // Build query
      const queryBuilder = categoryRepo
        .createQueryBuilder('category')
        .leftJoinAndSelect('category.parent', 'parent')
        .where('category.is_active = :isActive', { isActive: true });
      
      // Filter by parent if specified
      if (parentId !== undefined) {
        queryBuilder.andWhere('category.parent_id = :parentId', { parentId });
      }
      
      // Count total
      const total = await queryBuilder.getCount();
      
      // Apply sorting and pagination
      const categories = await queryBuilder
        .orderBy(`category.${sortBy}`, sortOrder)
        .skip(skip)
        .take(limit)
        .getMany();
      
      return {
        status: true,
        message: "Categories retrieved successfully",
        data: {
          categories,
          pagination: {
            // @ts-ignore
            page: parseInt(page),
            // @ts-ignore
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit)
          }
        },
      };
      
    } catch (error) {
      console.error("Get all categories error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to retrieve categories",
        data: null,
      };
    }
  }

  /**
   * Search categories by name
   * @param {{ query: string, includeInactive: boolean, _userId: number }} params
   */
  async searchCategories(params) {
    // @ts-ignore
    const { query, includeInactive = false, _userId } = params;
    
    try {
      if (!query || query.trim().length < 2) {
        return {
          status: false,
          message: "Search query must be at least 2 characters",
          data: [],
        };
      }
      
      const categoryRepo = AppDataSource.getRepository(Category);
      
      const queryBuilder = categoryRepo
        .createQueryBuilder('category')
        .leftJoinAndSelect('category.parent', 'parent')
        .where('(category.name LIKE :query OR category.description LIKE :query)', {
          query: `%${query}%`
        });
      
      if (!includeInactive) {
        queryBuilder.andWhere('category.is_active = :isActive', { isActive: true });
      }
      
      const categories = await queryBuilder
        .orderBy('category.name', 'ASC')
        .limit(50)
        .getMany();
      
      return {
        status: true,
        message: "Categories search completed",
        data: categories,
      };
      
    } catch (error) {
      console.error("Search categories error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to search categories",
        data: null,
      };
    }
  }

  /**
   * Get active categories for dropdowns (flat list)
   * @param {{ includeRoot: boolean, _userId: number }} params
   */
  async getActiveCategories(params) {
    // @ts-ignore
    const { includeRoot = true, _userId } = params;
    
    try {
      const categoryRepo = AppDataSource.getRepository(Category);
      
      const queryBuilder = categoryRepo
        .createQueryBuilder('category')
        .select(['category.id', 'category.name', 'category.parent_id'])
        .where('category.is_active = :isActive', { isActive: true });
      
      if (!includeRoot) {
        queryBuilder.andWhere('category.parent_id IS NOT NULL');
      }
      
      const categories = await queryBuilder
        .orderBy('category.name', 'ASC')
        .getMany();
      
      return {
        status: true,
        message: "Active categories retrieved successfully",
        data: categories,
      };
      
    } catch (error) {
      console.error("Get active categories error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to retrieve active categories",
        data: null,
      };
    }
  }

  /**
   * Get categories with product count
   * @param {{ _userId: number }} params
   */
  async getCategoriesWithProductCount(params) {
    // @ts-ignore
    const { _userId } = params;
    
    try {
      const categoryRepo = AppDataSource.getRepository(Category);
      const productRepo = AppDataSource.getRepository(Product);
      
      // Get all active categories
      const categories = await categoryRepo
        .createQueryBuilder('category')
        .where('category.is_active = :isActive', { isActive: true })
        .orderBy('category.name', 'ASC')
        .getMany();
      
      // Get product counts for each category
      const categoriesWithCounts = await Promise.all(
        categories.map(async (category) => {
          const productCount = await productRepo.count({
            // @ts-ignore
            where: { 
              category_id: category.id,
              is_deleted: false 
            },
          });
          
          return {
            ...category,
            productCount
          };
        })
      );
      
      return {
        status: true,
        message: "Categories with product count retrieved",
        data: categoriesWithCounts,
      };
      
    } catch (error) {
      console.error("Get categories with product count error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Failed to retrieve categories with product count",
        data: null,
      };
    }
  }

  /**
   * Main request handler
   * @param {Electron.IpcMainInvokeEvent} event 
   * @param {{ method: string; params: any; }} payload 
   */
  async handleRequest(event, payload) {
    try {
      const method = payload.method;
      const params = payload.params || {};
      const userId = params.userId || event.sender.id || 0;
      const enrichedParams = { ...params, _userId: userId };

      if (logger) {
        // @ts-ignore
        logger.info(`CategoryHandler: ${method}`, { 
          method, 
          userId,
          hasParams: !!Object.keys(params).length 
        });
      }

      // Route to appropriate method
      switch (method) {
        // 📦 CRUD OPERATIONS
        case "createCategory":
          return await this.handleWithTransaction(this.createCategory, enrichedParams);
        
        case "updateCategory":
          return await this.handleWithTransaction(this.updateCategory, enrichedParams);
        
        case "deleteCategory":
          return await this.handleWithTransaction(this.deleteCategory, enrichedParams);
        
        case "getCategoryById":
          return await this.getCategoryById(enrichedParams);

        // 🌳 HIERARCHICAL OPERATIONS
        case "getCategoryTree":
          return await this.getCategoryTree(enrichedParams);
        
        case "getSubcategories":
          return await this.getSubcategories(enrichedParams);
        
        case "moveCategory":
          return await this.handleWithTransaction(this.moveCategory, enrichedParams);

        // 🔍 READ-ONLY OPERATIONS
        case "getAllCategories":
          return await this.getAllCategories(enrichedParams);
        
        case "searchCategories":
          return await this.searchCategories(enrichedParams);
        
        case "getActiveCategories":
          return await this.getActiveCategories(enrichedParams);
        
        case "getCategoriesWithProductCount":
          return await this.getCategoriesWithProductCount(enrichedParams);

        default:
          return {
            status: false,
            message: `Method '${method}' not available in CategoryHandler`,
            data: null,
          };
      }
    } catch (error) {
      console.error("CategoryHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("CategoryHandler error:", error);
      }
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Internal server error",
        data: null,
      };
    }
  }

  /**
   * Wrap critical operations in a database transaction
   * @param {(params: any, queryRunner?: import("typeorm").QueryRunner) => Promise<any>} handler
   * @param {{ _userId: number; }} params
   */
  async handleWithTransaction(handler, params) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await handler(params, queryRunner);

      if (result.status) {
        await queryRunner.commitTransaction();
      } else {
        await queryRunner.rollbackTransaction();
      }

      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

// Register IPC handler
const categoryHandler = new CategoryHandler();

ipcMain.handle(
  "category",
  withErrorHandling(
    // @ts-ignore
    categoryHandler.handleRequest.bind(categoryHandler),
    "IPC:category",
  ),
);

module.exports = { CategoryHandler, categoryHandler };