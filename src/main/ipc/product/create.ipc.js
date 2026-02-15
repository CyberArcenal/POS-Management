// src/main/ipc/product/create.ipc
//@ts-check
const { validateProductData } = require("../../../utils/productUtils");
const auditLogger = require("../../../utils/auditLogger");

/**
 * @param {Object} params
 * @param {string} params.sku
 * @param {string} params.name
 * @param {number} params.price
 * @param {number} [params.stockQty]
 * @param {string} [params.description]
 * @param {boolean} [params.isActive]
 * @param {string} [params.user] - username or ID
 * @param {import("typeorm").QueryRunner} queryRunner
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params, queryRunner) => {
  const { sku, name, price, stockQty = 0, description, isActive = true, user = "system" } = params;

  // Validate input
  const validation = validateProductData({ sku, name, price, stockQty });
  if (!validation.valid) {
    return { status: false, message: validation.errors.join(", "), data: null };
  }

  try {
    const productRepo = queryRunner.manager.getRepository("Product");

    // Check SKU uniqueness
    const existing = await productRepo.findOne({ where: { sku } });
    if (existing) {
      return { status: false, message: `Product with SKU "${sku}" already exists`, data: null };
    }

    // Create product
    const newProduct = productRepo.create({
      sku,
      name,
      description,
      price,
      stockQty,
      isActive,
      createdAt: new Date(),
    });

    const savedProduct = await productRepo.save(newProduct);

    // Audit log (using queryRunner for transactional logging)
    const auditRepo = queryRunner.manager.getRepository("AuditLog");
    await auditRepo.save({
      action: "CREATE",
      entity: "Product",
      entityId: savedProduct.id,
      user,
      timestamp: new Date(),
      description: `Created product: ${savedProduct.name}`,
    });

    return {
      status: true,
      message: "Product created successfully",
      data: savedProduct,
    };
  } catch (error) {
    console.error("Error in createProduct:", error);
    return {
      status: false,
      message: error.message || "Failed to create product",
      data: null,
    };
  }
};