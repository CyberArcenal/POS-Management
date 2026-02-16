//@ts-check
const fs = require("fs").promises;
// @ts-ignore
const path = require("path");
const Customer = require("../../../entities/Customer");
const { validateCustomerData } = require("../../../utils/customerUtils");

/**
 * Import customers from a CSV file
 * @param {Object} params
 * @param {string} params.filePath - Full path to CSV file
 * @param {string} [params.userId] - User
 * @param {import("typeorm").QueryRunner} queryRunner - Transaction runner
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params, queryRunner) => {
  const { filePath, userId = "system" } = params;
  const created = [];
  const errors = [];

  if (!filePath || typeof filePath !== "string") {
    return { status: false, message: "Valid file path required", data: null };
  }

  try {
    const fileContent = await fs.readFile(filePath, "utf-8");
    const lines = fileContent.split("\n").filter((line) => line.trim() !== "");
    if (lines.length < 2) {
      throw new Error("CSV must have at least a header and one data row");
    }

    const headers = lines[0].split(",").map((h) => h.trim());
    const nameIdx = headers.indexOf("name");
    const contactIdx = headers.indexOf("contactInfo");
    const pointsIdx = headers.indexOf("loyaltyPointsBalance");

    if (nameIdx === -1) {
      throw new Error("CSV must contain 'name' column");
    }

    const repo = queryRunner.manager.getRepository(Customer);
    const auditRepo = queryRunner.manager.getRepository("AuditLog");

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const rowData = {
        name: values[nameIdx] || "",
        contactInfo: contactIdx !== -1 ? values[contactIdx] : undefined,
        loyaltyPointsBalance:
          pointsIdx !== -1 ? parseFloat(values[pointsIdx]) : 0,
      };

      const validation = validateCustomerData(rowData);
      if (!validation.valid) {
        errors.push({ row: i + 1, errors: validation.errors });
        continue;
      }

      try {
        const customer = repo.create({
          name: rowData.name,
          contactInfo: rowData.contactInfo || null,
          loyaltyPointsBalance: rowData.loyaltyPointsBalance || 0,
          createdAt: new Date(),
        });
        const saved = await repo.save(customer);
        created.push(saved);

        const log = auditRepo.create({
          action: "IMPORT",
          entity: "Customer",
          entityId: saved.id,
          user: userId,
          timestamp: new Date(),
        });
        await auditRepo.save(log);
      } catch (err) {
        // @ts-ignore
        errors.push({ row: i + 1, error: err.message });
      }
    }

    return {
      status: errors.length === 0,
      message: `Import completed. Created: ${created.length}, Errors: ${errors.length}`,
      data: { created, errors },
    };
  } catch (error) {
    console.error("Error in importCustomersFromCSV:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message || "CSV import failed",
      data: null,
    };
  }
};
