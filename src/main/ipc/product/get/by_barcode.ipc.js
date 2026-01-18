//@ts-check

const Product = require("../../../../entities/Product");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get products by barcode
 * @param {string} barcode
 * @param {number} userId
 */
async function getProductsByBarcode(barcode, userId) {
  try {
    if (!barcode || barcode.trim().length === 0) {
      return {
        status: false,
        message: "Barcode is required",
        data: []
      };
    }

    const productRepo = AppDataSource.getRepository(Product);
    
    // Try exact barcode match first
    const exactMatch = await productRepo.findOne({
      where: {
        barcode: barcode.trim(),
        is_deleted: false
      }
    });

    if (exactMatch) {
      return {
        status: true,
        message: "Product found by barcode",
        data: [exactMatch]
      };
    }

    // If no exact match, try SKU as alternative
    const skuMatch = await productRepo.findOne({
      where: {
        sku: barcode.trim(),
        is_deleted: false
      }
    });

    if (skuMatch) {
      return {
        status: true,
        message: "Product found by SKU",
        data: [skuMatch]
      };
    }

    // If still no match, search in name and description
    const similarProducts = await productRepo
      .createQueryBuilder("product")
      .where("product.is_deleted = :is_deleted", { is_deleted: false })
      .andWhere("(product.name LIKE :barcode OR product.description LIKE :barcode OR product.sku LIKE :barcode)", {
        barcode: `%${barcode}%`
      })
      .limit(10)
      .getMany();

    return {
      status: true,
      message: similarProducts.length > 0 
        ? "No exact barcode match, showing similar products" 
        : "No products found",
      data: similarProducts
    };
  } catch (error) {
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: []
    };
  }
}

module.exports = getProductsByBarcode;