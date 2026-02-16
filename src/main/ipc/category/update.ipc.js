// @ts-check
const { AuditLog } = require("../../../entities/AuditLog");
const { validateCategoryData } = require("../../../utils/categoryUtils");

/**
 * Update an existing category (transactional)
 * @param {Object} params
 * @param {number} params.id - Category ID
 * @param {string} [params.name] - New name
 * @param {string} [params.description] - New description
 * @param {boolean} [params.isActive] - New active status
 * @param {string} [params.user] - User identifier for audit
 * @param {import("typeorm").QueryRunner} queryRunner - Transaction query runner
 * @returns {Promise<{ status: boolean; message?: string; data?: any }>}
 */
module.exports = async (params, queryRunner) => {
  if (!queryRunner) {
    throw new Error("Transaction queryRunner required for update operation");
  }

  try {
    const { id, name, description, isActive, user = "system" } = params;
    if (!id || isNaN(Number(id))) {
      throw new Error("Invalid or missing category ID");
    }

    const categoryRepo = queryRunner.manager.getRepository("Category");

    // Find existing
    const existing = await categoryRepo.findOne({ where: { id: Number(id) } });
    if (!existing) {
      throw new Error(`Category with ID ${id} not found`);
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Validate if anything changed
    if (Object.keys(updateData).length === 0) {
      return {
        status: true,
        message: "No changes provided",
        data: existing,
      };
    }

    // If name is changing, validate and check uniqueness
    if (updateData.name && updateData.name !== existing.name) {
      const validation = validateCategoryData({ name: updateData.name });
      if (!validation.valid) {
        throw new Error(validation.errors.join(", "));
      }
      const nameExists = await categoryRepo.findOne({
        where: { name: updateData.name },
      });
      if (nameExists) {
        throw new Error(`Category with name "${updateData.name}" already exists`);
      }
    }

    // Apply updates
    Object.assign(existing, updateData);
    existing.updatedAt = new Date();

    const savedCategory = await categoryRepo.save(existing);

    // Audit log
    const auditRepo = queryRunner.manager.getRepository(AuditLog);
    const audit = auditRepo.create({
      action: "UPDATE",
      entity: "Category",
      entityId: savedCategory.id,
      user,
      timestamp: new Date(),
      description: `Category updated: ${savedCategory.name}`,
    });
    await auditRepo.save(audit);

    return {
      status: true,
      message: "Category updated successfully",
      data: savedCategory,
    };
  } catch (error) {
    console.error("[update.ipc] Error:", error.message);
    return {
      status: false,
      message: error.message || "Failed to update category",
      data: null,
    };
  }
};