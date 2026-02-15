// src/main/ipc/product/delete.ipc
//@ts-check
/**
 * @param {Object} params
 * @param {number} params.id
 * @param {string} [params.user]
 * @param {import("typeorm").QueryRunner} queryRunner
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params, queryRunner) => {
  const { id, user = "system" } = params;
  if (!id || typeof id !== "number") {
    return { status: false, message: "Valid product ID is required", data: null };
  }

  try {
    const productRepo = queryRunner.manager.getRepository("Product");

    const product = await productRepo.findOne({ where: { id } });
    if (!product) {
      return { status: false, message: `Product with ID ${id} not found`, data: null };
    }

    if (!product.isActive) {
      return { status: false, message: `Product #${id} is already inactive`, data: null };
    }

    const oldData = { ...product };
    product.isActive = false;
    product.updatedAt = new Date();

    const deactivatedProduct = await productRepo.save(product);

    // Audit log
    const auditRepo = queryRunner.manager.getRepository("AuditLog");
    await auditRepo.save({
      action: "DELETE", // soft delete
      entity: "Product",
      entityId: id,
      user,
      timestamp: new Date(),
      description: `Deactivated product: ${deactivatedProduct.name}`,
    });

    return {
      status: true,
      message: "Product deactivated successfully",
      data: deactivatedProduct,
    };
  } catch (error) {
    console.error("Error in deleteProduct:", error);
    return {
      status: false,
      message: error.message || "Failed to deactivate product",
      data: null,
    };
  }
};