// src/main/ipc/product/bulk_update.ipc
//@ts-check
/**
 * @param {Object} params
 * @param {Array<{id: number, updates: Object}>} params.updates - each item has id and updates object
 * @param {string} [params.user]
 * @param {import("typeorm").QueryRunner} queryRunner
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params, queryRunner) => {
  const { updates, user = "system" } = params;
  if (!Array.isArray(updates) || updates.length === 0) {
    return { status: false, message: "updates array is required", data: null };
  }

  try {
    const productRepo = queryRunner.manager.getRepository("Product");
    const auditRepo = queryRunner.manager.getRepository("AuditLog");

    const updated = [];
    const errors = [];

    for (const item of updates) {
      const { id, updates: changes } = item;
      if (!id || typeof id !== "number") {
        errors.push({ item, errors: ["Invalid or missing product id"] });
        continue;
      }

      try {
        const product = await productRepo.findOne({ where: { id } });
        if (!product) {
          errors.push({ item, errors: [`Product with id ${id} not found`] });
          continue;
        }

        // If SKU is changed, check uniqueness
        if (changes.sku && changes.sku !== product.sku) {
          const existing = await productRepo.findOne({ where: { sku: changes.sku } });
          if (existing) {
            errors.push({ item, errors: [`SKU "${changes.sku}" already exists`] });
            continue;
          }
        }

        const oldData = { ...product };
        Object.assign(product, changes);
        product.updatedAt = new Date();
        const saved = await productRepo.save(product);
        updated.push(saved);

        await auditRepo.save({
          action: "UPDATE",
          entity: "Product",
          entityId: id,
          user,
          timestamp: new Date(),
          description: `Bulk updated product: ${saved.name}`,
        });
      } catch (itemError) {
        errors.push({ item, errors: [itemError.message] });
      }
    }

    return {
      status: true,
      message: `Bulk update completed. ${updated.length} updated, ${errors.length} failed.`,
      data: { updated, errors },
    };
  } catch (error) {
    console.error("Error in bulkUpdateProducts:", error);
    return {
      status: false,
      message: error.message || "Bulk update failed",
      data: null,
    };
  }
};