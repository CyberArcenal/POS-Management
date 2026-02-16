// @ts-check
const { AuditLog } = require("../../../entities/AuditLog");
const { validateCategoryData } = require("../../../utils/categoryUtils");

/**
 * Create a new category (transactional)
 * @param {Object} params
 * @param {string} params.name - Category name (unique)
 * @param {string} [params.description] - Optional description
 * @param {boolean} [params.isActive] - Default true
 * @param {string} [params.user] - User identifier for audit
 * @param {import("typeorm").QueryRunner} queryRunner - Transaction query runner
 * @returns {Promise<{ status: boolean; message?: string; data?: any }>}
 */
module.exports = async (params, queryRunner) => {
  if (!queryRunner) {
    throw new Error("Transaction queryRunner required for create operation");
  }

  try {
    const { name, description, isActive = true, user = "system" } = params;

    // Validate input
    const validation = validateCategoryData({ name, description, isActive });
    if (!validation.valid) {
      throw new Error(validation.errors.join(", "));
    }

    const categoryRepo = queryRunner.manager.getRepository("Category");

    // Check name uniqueness
    const existing = await categoryRepo.findOne({ where: { name } });
    if (existing) {
      throw new Error(`Category with name "${name}" already exists`);
    }

    // Create entity
    const newCategory = categoryRepo.create({
      name,
      description: description || null,
      isActive,
      createdAt: new Date(),
    });

    const savedCategory = await categoryRepo.save(newCategory);

    // Audit log
    const auditRepo = queryRunner.manager.getRepository(AuditLog);
    const audit = auditRepo.create({
      action: "CREATE",
      entity: "Category",
      entityId: savedCategory.id,
      user,
      timestamp: new Date(),
      description: `Category created: ${savedCategory.name}`,
    });
    await auditRepo.save(audit);

    return {
      status: true,
      message: "Category created successfully",
      data: savedCategory,
    };
  } catch (error) {
    console.error("[create.ipc] Error:", error.message);
    return {
      status: false,
      message: error.message || "Failed to create category",
      data: null,
    };
  }
};