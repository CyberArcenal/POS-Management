// @ts-check
const { AuditLog } = require("../../../entities/AuditLog");

/**
 * Soft delete a category (set isActive = false) (transactional)
 * @param {Object} params
 * @param {number} params.id - Category ID
 * @param {string} [params.user] - User identifier for audit
 * @param {import("typeorm").QueryRunner} queryRunner - Transaction query runner
 * @returns {Promise<{ status: boolean; message?: string; data?: any }>}
 */
module.exports = async (params, queryRunner) => {
  if (!queryRunner) {
    throw new Error("Transaction queryRunner required for delete operation");
  }

  try {
    const { id, user = "system" } = params;
    if (!id || isNaN(Number(id))) {
      throw new Error("Invalid or missing category ID");
    }

    const categoryRepo = queryRunner.manager.getRepository("Category");

    // Find existing
    const category = await categoryRepo.findOne({ where: { id: Number(id) } });
    if (!category) {
      throw new Error(`Category with ID ${id} not found`);
    }

    if (!category.isActive) {
      throw new Error(`Category #${id} is already inactive`);
    }

    // Soft delete
    category.isActive = false;
    category.updatedAt = new Date();
    const savedCategory = await categoryRepo.save(category);

    // Audit log
    const auditRepo = queryRunner.manager.getRepository(AuditLog);
    const audit = auditRepo.create({
      action: "DELETE",
      entity: "Category",
      entityId: savedCategory.id,
      user,
      timestamp: new Date(),
      description: `Category deactivated: ${savedCategory.name}`,
    });
    await auditRepo.save(audit);

    return {
      status: true,
      message: "Category deactivated successfully",
      data: savedCategory,
    };
  } catch (error) {
    console.error("[delete.ipc] Error:", error.message);
    return {
      status: false,
      message: error.message || "Failed to delete category",
      data: null,
    };
  }
};