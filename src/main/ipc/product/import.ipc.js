// src/ipc/product/import.ipc.js
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const { Product } = require("../../../entities/Product");
const { AppDataSource } = require("../../db/dataSource");

/**
 * Import products from CSV/Excel file
 * @param {{
 *   file_path: string,
 *   file_type: 'csv' | 'excel',
 *   mapping: object,
 *   options: {
 *     update_existing: boolean,
 *     skip_errors: boolean,
 *     dry_run: boolean
 *   },
 *   _userId: number
 * }} params
 * @param {import("typeorm").QueryRunner} queryRunner
 */
module.exports = async function importProducts(params, queryRunner = null) {
  const {
    file_path,
    file_type,
    mapping,
    options = {
      update_existing: true,
      skip_errors: false,
      dry_run: false
    },
    _userId
  } = params;
  
  try {
    if (!file_path || !fs.existsSync(file_path)) {
      return {
        status: false,
        message: "File not found",
        data: null,
      };
    }
    
    if (!mapping || !mapping.sku) {
      return {
        status: false,
        message: "Field mapping must include SKU field",
        data: null,
      };
    }
    
    const productRepo = queryRunner 
      ? queryRunner.manager.getRepository(Product)
      : AppDataSource.getRepository(Product);
    
    // Read file based on type
    let rows = [];
    
    if (file_type === 'csv') {
      rows = await readCSVFile(file_path);
    } else if (file_type === 'excel') {
      rows = await readExcelFile(file_path);
    } else {
      return {
        status: false,
        message: `Unsupported file type: ${file_type}`,
        data: null,
      };
    }
    
    if (rows.length === 0) {
      return {
        status: false,
        message: "File is empty or no data found",
        data: null,
      };
    }
    
    // Process rows
    const results = {
      total: rows.length,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      validation_errors: [],
      details: [],
    };
    
    // Validate and process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 for header row
      
      try {
        // Map fields
        const productData = mapFields(row, mapping);
        
        // Validate required fields
        const validation = validateProductData(productData);
        if (!validation.valid) {
          if (!options.skip_errors) {
            throw new Error(validation.message);
          }
          results.skipped++;
          results.validation_errors.push({
            row: rowNumber,
            sku: productData.sku || 'N/A',
            error: validation.message,
          });
          continue;
        }
        
        // Check if product exists
        const existingProduct = await productRepo.findOne({
          where: { sku: productData.sku, is_deleted: false }
        });
        
        if (existingProduct) {
          if (options.update_existing) {
            if (!options.dry_run) {
              // Update existing product
              Object.assign(existingProduct, productData, {
                updated_by: _userId,
                updated_at: new Date(),
              });
              
              await productRepo.save(existingProduct);
            }
            results.updated++;
            results.details.push({
              row: rowNumber,
              sku: productData.sku,
              action: 'updated',
              product_id: existingProduct.id,
            });
          } else {
            results.skipped++;
            results.details.push({
              row: rowNumber,
              sku: productData.sku,
              action: 'skipped',
              reason: 'Product already exists and update_existing is false',
            });
          }
        } else {
          if (!options.dry_run) {
            // Create new product
            const product = productRepo.create({
              ...productData,
              created_by: _userId,
            });
            
            const savedProduct = await productRepo.save(product);
            results.imported++;
            results.details.push({
              row: rowNumber,
              sku: productData.sku,
              action: 'created',
              product_id: savedProduct.id,
            });
          } else {
            results.imported++;
            results.details.push({
              row: rowNumber,
              sku: productData.sku,
              action: 'created (dry run)',
            });
          }
        }
        
      } catch (error) {
        results.errors++;
        results.details.push({
          row: rowNumber,
          sku: row[mapping.sku] || 'N/A',
          action: 'error',
          error: error.message,
        });
        
        if (!options.skip_errors) {
          // Stop processing on first error if skip_errors is false
          return {
            status: false,
            message: `Error on row ${rowNumber}: ${error.message}`,
            data: {
              results,
              failed_row: rowNumber,
              sample_data: rows[i],
            },
          };
        }
      }
    }
    
    // Generate import report
    const report = {
      timestamp: new Date(),
      file_info: {
        path: file_path,
        type: file_type,
        rows: rows.length,
      },
      options,
      results: {
        success_rate: ((results.imported + results.updated) / rows.length * 100).toFixed(2),
        failed_rate: (results.errors / rows.length * 100).toFixed(2),
      },
      next_actions: [],
    };
    
    if (results.imported > 0) {
      report.next_actions.push('Review newly imported products');
    }
    
    if (results.validation_errors.length > 0) {
      report.next_actions.push('Fix validation errors and re-import');
    }
    
    if (options.dry_run) {
      report.next_actions.push('Run import again without dry_run flag to apply changes');
    }
    
    // Log import activity
    if (_userId && !options.dry_run) {
      const activityRepo = queryRunner 
        ? queryRunner.manager.getRepository(require("../../../entities/UserActivity"))
        : AppDataSource.getRepository(require("../../../entities/UserActivity"));
      
      await activityRepo.save({
        user_id: _userId,
        action: "product_import",
        entity: "Product",
        entity_id: null,
        description: `Imported ${results.imported} products, updated ${results.updated} products`,
        details: JSON.stringify({
          file_path,
          file_type,
          results,
          timestamp: new Date(),
        }),
      });
    }
    
    return {
      status: true,
      message: options.dry_run ? "Dry run completed" : "Import completed",
      data: {
        results,
        report,
        sample_products: results.details.slice(0, 5),
        validation_summary: {
          total_errors: results.errors + results.validation_errors.length,
          validation_errors: results.validation_errors,
        },
      },
    };
    
  } catch (error) {
    console.error("Import products error:", error);
    return {
      status: false,
      message: error.message || "Failed to import products",
      data: null,
    };
  }
};

// Helper functions
async function readCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

async function readExcelFile(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(worksheet);
}

function mapFields(row, mapping) {
  const productData = {};
  
  Object.keys(mapping).forEach(key => {
    const sourceField = mapping[key];
    if (sourceField && row[sourceField] !== undefined) {
      // Handle special field conversions
      switch (key) {
        case 'price':
        case 'cost_price':
        case 'selling_price':
        case 'wholesale_price':
          productData[key] = parseFloat(row[sourceField]) || 0;
          break;
        case 'stock':
        case 'min_stock_level':
        case 'reorder_level':
        case 'max_stock_level':
          productData[key] = parseInt(row[sourceField]) || 0;
          break;
        case 'is_active':
        case 'is_taxable':
        case 'has_expiry':
          productData[key] = ['true', 'yes', '1', 1, true].includes(row[sourceField].toString().toLowerCase());
          break;
        case 'tags':
          if (row[sourceField]) {
            productData[key] = row[sourceField].split(',').map(tag => tag.trim());
          }
          break;
        default:
          productData[key] = row[sourceField];
      }
    }
  });
  
  return productData;
}

function validateProductData(data) {
  // Required fields
  if (!data.sku) {
    return { valid: false, message: 'SKU is required' };
  }
  
  if (!data.name) {
    return { valid: false, message: 'Name is required' };
  }
  
  if (data.selling_price === undefined || data.selling_price === null) {
    return { valid: false, message: 'Selling price is required' };
  }
  
  // Field validations
  if (data.sku.length < 3) {
    return { valid: false, message: 'SKU must be at least 3 characters' };
  }
  
  if (data.selling_price <= 0) {
    return { valid: false, message: 'Selling price must be greater than 0' };
  }
  
  if (data.cost_price && data.cost_price > data.selling_price) {
    return { 
      valid: false, 
      message: 'Cost price cannot be higher than selling price' 
    };
  }
  
  if (data.min_stock_level && data.max_stock_level && 
      data.min_stock_level > data.max_stock_level) {
    return { 
      valid: false, 
      message: 'Min stock level cannot be higher than max stock level' 
    };
  }
  
  return { valid: true };
}