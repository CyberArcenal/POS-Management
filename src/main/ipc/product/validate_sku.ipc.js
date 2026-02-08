// src/ipc/product/validate_sku.ipc.js
const { Product } = require("../../../entities/Product");
const { AppDataSource } = require("../../db/dataSource");

/**
 * Validate SKU uniqueness and format
 * @param {string} sku
 * @param {number} userId
 * @param {number} excludeId - Product ID to exclude (for updates)
 */
module.exports = async function validateProductSKU(sku, userId, excludeId = null) {
  try {
    if (!sku || sku.trim() === '') {
      return {
        status: false,
        message: "SKU cannot be empty",
        data: { valid: false, reason: 'empty' },
      };
    }
    
    // Basic format validation
    const skuRegex = /^[A-Za-z0-9\-_.]+$/;
    if (!skuRegex.test(sku)) {
      return {
        status: true,
        message: "SKU contains invalid characters",
        data: {
          valid: false,
          reason: 'invalid_format',
          allowed_characters: 'Letters, numbers, hyphen, underscore, period',
        },
      };
    }
    
    if (sku.length < 3) {
      return {
        status: true,
        message: "SKU too short",
        data: {
          valid: false,
          reason: 'too_short',
          minimum_length: 3,
        },
      };
    }
    
    if (sku.length > 100) {
      return {
        status: true,
        message: "SKU too long",
        data: {
          valid: false,
          reason: 'too_long',
          maximum_length: 100,
        },
      };
    }
    
    // Check uniqueness
    const productRepo = AppDataSource.getRepository(Product);
    
    const whereCondition = { 
      sku: sku,
      is_deleted: false 
    };
    
    if (excludeId) {
      whereCondition.id = excludeId ? { $not: excludeId } : undefined;
    }
    
    const existingProduct = await productRepo.findOne({
      where: whereCondition,
    });
    
    if (existingProduct) {
      return {
        status: true,
        message: "SKU already exists",
        data: {
          valid: false,
          reason: 'duplicate',
          existing_product: {
            id: existingProduct.id,
            name: existingProduct.name,
            sku: existingProduct.sku,
          },
        },
      };
    }
    
    // Check for similar SKUs (fuzzy match for duplicates)
    const similarProducts = await productRepo.createQueryBuilder('product')
      .where('product.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere('product.sku LIKE :similarSku', { similarSku: `%${sku}%` })
      .andWhere('product.sku != :sku', { sku })
      .take(5)
      .getMany();
    
    // Suggest alternative SKUs if current one might be too similar
    let suggestions = [];
    if (similarProducts.length > 0) {
      suggestions = similarProducts.map(p => p.sku);
    }
    
    // Generate suggestions for new SKUs
    const baseSku = sku.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    const generatedSuggestions = [
      `${baseSku}-${timestamp}`,
      `${baseSku}-${randomSuffix}`,
      `${baseSku}-001`,
      `${baseSku}-A`,
    ].filter(suggestion => suggestion !== sku);
    
    return {
      status: true,
      message: "SKU is valid and available",
      data: {
        valid: true,
        sku: sku,
        length: sku.length,
        format_valid: true,
        similar_existing: similarProducts.map(p => ({ id: p.id, sku: p.sku, name: p.name })),
        suggestions: [...suggestions, ...generatedSuggestions].slice(0, 5),
      },
    };
    
  } catch (error) {
    console.error("Validate SKU error:", error);
    return {
      status: false,
      message: error.message || "Failed to validate SKU",
      data: null,
    };
  }
};