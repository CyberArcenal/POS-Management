// src/main/ipc/product/bulk_create.ipc
//@ts-check
const { validateProductData } = require("../../../utils/productUtils");

/**
 * @param {Object} params
 * @param {Array<Object>} params.products - array of product objects
 * @param {string} [params.user]
 * @param {import("typeorm").QueryRunner} queryRunner
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params, queryRunner) => {
  const { products, user = "system" } = params;
  if (!Array.isArray(products) || products.length === 0) {
    return { status: false, message: "products array is required", data: null };
  }

  try {
    const productRepo = queryRunner.manager.getRepository("Product");
    const auditRepo = queryRunner.manager.getRepository("AuditLog");

    const created = [];
    const errors = [];

    for (const prodData of products) {
      try {
        // Validate each product
        const validation = validateProductData(prodData);
        if (!validation.valid) {
          errors.push({ product: prodData, errors: validation.errors });
          continue;
        }

        // Check SKU uniqueness
        const existing = await productRepo.findOne({ where: { sku: prodData.sku } });
        if (existing) {
          errors.push({ product: prodData, errors: [`SKU "${prodData.sku}" already exists`] });
          continue;
        }

        const newProduct = productRepo.create({
          ...prodData,
          createdAt: new Date(),
        });
        const saved = await productRepo.save(newProduct);
        created.push(saved);

        // Audit log per product
        await auditRepo.save({
          action: "CREATE",
          entity: "Product",
          entityId: saved.id,
          user,
          timestamp: new Date(),
          description: `Bulk created product: ${saved.name}`,
        });
      } catch (itemError) {
        errors.push({ product: prodData, errors: [itemError.message] });
      }
    }

    return {
      status: true,
      message: `Bulk create completed. ${created.length} created, ${errors.length} failed.`,
      data: { created, errors },
    };
  } catch (error) {
    console.error("Error in bulkCreateProducts:", error);
    return {
      status: false,
      message: error.message || "Bulk create failed",
      data: null,
    };
  }
};