// src/main/ipc/product/update.ipc
//@ts-check
/**
 * @param {Object} params
 * @param {number} params.id
 * @param {string} [params.sku]
 * @param {string} [params.name]
 * @param {number} [params.price]
 * @param {number} [params.stockQty]
 * @param {string} [params.description]
 * @param {boolean} [params.isActive]
 * @param {string} [params.user]
 * @param {import("typeorm").QueryRunner} queryRunner
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params, queryRunner) => {
  const { id, user = "system", ...updates } = params;
  if (!id || typeof id !== "number") {
    return { status: false, message: "Valid product ID is required", data: null };
  }

  try {
    const productRepo = queryRunner.manager.getRepository("Product");

    const product = await productRepo.findOne({ where: { id } });
    if (!product) {
      return { status: false, message: `Product with ID ${id} not found`, data: null };
    }

    // If SKU is being changed, check uniqueness
    if (updates.sku && updates.sku !== product.sku) {
      const existing = await productRepo.findOne({ where: { sku: updates.sku } });
      if (existing) {
        return { status: false, message: `Product with SKU "${updates.sku}" already exists`, data: null };
      }
    }

    // Keep old data for audit
    const oldData = { ...product };

    // Apply updates
    Object.assign(product, updates);
    product.updatedAt = new Date();

    const updatedProduct = await productRepo.save(product);

    // Audit log
    const auditRepo = queryRunner.manager.getRepository("AuditLog");
    await auditRepo.save({
      action: "UPDATE",
      entity: "Product",
      entityId: id,
      user,
      timestamp: new Date(),
      description: `Updated product: ${updatedProduct.name}`,
      // Optionally store old/new data in a JSON field if AuditLog has it
    });

    return {
      status: true,
      message: "Product updated successfully",
      data: updatedProduct,
    };
  } catch (error) {
    console.error("Error in updateProduct:", error);
    return {
      status: false,
      message: error.message || "Failed to update product",
      data: null,
    };
  }
};