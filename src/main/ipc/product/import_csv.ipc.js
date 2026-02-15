// src/main/ipc/product/import_csv.ipc
//@ts-check
const fs = require("fs").promises;
const path = require("path");
const csv = require("csv-parse/sync"); // you'll need to install: npm install csv-parse
const { validateProductData } = require("../../../utils/productUtils");

/**
 * @param {Object} params
 * @param {string} params.filePath - absolute path to CSV file
 * @param {string} [params.user]
 * @param {import("typeorm").QueryRunner} queryRunner
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params, queryRunner) => {
  const { filePath, user = "system" } = params;
  if (!filePath) {
    return { status: false, message: "filePath is required", data: null };
  }

  try {
    // Read and parse CSV
    const fileContent = await fs.readFile(filePath, "utf-8");
    const records = csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const productRepo = queryRunner.manager.getRepository("Product");
    const auditRepo = queryRunner.manager.getRepository("AuditLog");

    const imported = [];
    const errors = [];

    for (const record of records) {
      try {
        // Convert types: price and stockQty should be numbers
        const productData = {
          sku: record.sku,
          name: record.name,
          description: record.description,
          price: parseFloat(record.price),
          stockQty: parseInt(record.stockQty, 10) || 0,
          isActive: record.isActive !== "false", // treat any non-false as true
        };

        const validation = validateProductData(productData);
        if (!validation.valid) {
          errors.push({ row: record, errors: validation.errors });
          continue;
        }

        const existing = await productRepo.findOne({ where: { sku: productData.sku } });
        if (existing) {
          errors.push({ row: record, errors: [`SKU "${productData.sku}" already exists`] });
          continue;
        }

        const newProduct = productRepo.create({
          ...productData,
          createdAt: new Date(),
        });
        const saved = await productRepo.save(newProduct);
        imported.push(saved);

        await auditRepo.save({
          action: "CREATE",
          entity: "Product",
          entityId: saved.id,
          user,
          timestamp: new Date(),
          description: `Imported from CSV: ${saved.name}`,
        });
      } catch (itemError) {
        errors.push({ row: record, errors: [itemError.message] });
      }
    }

    return {
      status: true,
      message: `CSV import completed. ${imported.length} imported, ${errors.length} failed.`,
      data: { imported, errors },
    };
  } catch (error) {
    console.error("Error in importProductsFromCSV:", error);
    return {
      status: false,
      message: error.message || "CSV import failed",
      data: null,
    };
  }
};