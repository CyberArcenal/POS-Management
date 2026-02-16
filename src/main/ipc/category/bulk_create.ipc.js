// @ts-check
const { AuditLog } = require("../../../entities/AuditLog");
const { validateCategoryData } = require("../../../utils/categoryUtils");

/**
 * Bulk create categories (transactional)
 * @param {Object} params
 * @param {Array<{ name: string; description?: string; isActive?: boolean }>} params.categories
 * @param {string} [params.user] - User identifier for audit
 * @param {import("typeorm").QueryRunner} queryRunner - Transaction query runner
 * @returns {Promise<{ status: boolean; message?: string; data?: any }>}
 */
module.exports = async (params, queryRunner) => {
  if (!queryRunner) {
    throw new Error("Transaction queryRunner required for bulk create");
  }

  try {
    const { categories, user = "system" } = params;
    if (!Array.isArray(categories) || categories.length === 0) {
      throw new Error("Categories array is required and must not be empty");
    }

    const categoryRepo = queryRunner.manager.getRepository("Category");
    const auditRepo = queryRunner.manager.getRepository(AuditLog);

    const created = [];
    const errors = [];

    // Process each category sequentially to maintain name uniqueness check
    for (const cat of categories) {
      try {
        const { name, description, isActive = true } = cat;

        // Validate
        const validation = validateCategoryData({ name, description, isActive });
        if (!validation.valid) {
          throw new Error(validation.errors.join(", "));
        }

        // Check duplicate within this batch or existing
        const existing = await categoryRepo.findOne({ where: { name } });
        if (existing) {
          throw new Error(`Category with name "${name}" already exists`);
        }

        const newCat = categoryRepo.create({
          name,
          description: description || null,
          isActive,
          createdAt: new Date(),
        });
        const saved = await categoryRepo.save(newCat);
        created.push(saved);

        // Audit for each
        const audit = auditRepo.create({
          action: "CREATE",
          entity: "Category",
          entityId: saved.id,
          user,
          timestamp: new Date(),
          description: `Bulk created category: ${saved.name}`,
        });
        await auditRepo.save(audit);
      } catch (err) {
        errors.push({ category: cat, error: err.message });
      }
    }

    if (errors.length > 0) {
      // If any error, we rollback the transaction by throwing
      // The wrapper will rollback
      throw new Error(`Bulk create failed for some categories: ${JSON.stringify(errors)}`);
    }

    return {
      status: true,
      message: `Successfully created ${created.length} categories`,
      data: created,
    };
  } catch (error) {
    console.error("[bulk_create.ipc] Error:", error.message);
    return {
      status: false,
      message: error.message || "Bulk create failed",
      data: null,
    };
  }
};