// src/ipc/product/export.ipc.js
//@ts-check
const fs = require('fs');
const path = require('path');
// @ts-ignore
const xlsx = require('xlsx');
const { Product } = require("../../../entities/Product");
const { AppDataSource } = require("../../db/dataSource");

/**
 * Export products to CSV/Excel file
 * @param {{
 *   export_type: 'csv' | 'excel' | 'json',
 *   filters?: object,
 *   fields?: string[],
 *   include_deleted?: boolean,
 *   _userId: number
 * }} params
 */
module.exports = async function exportProducts(params) {
  const {
    export_type = 'excel',
    filters = {},
    fields = [
      'id', 'sku', 'barcode', 'name', 'selling_price', 'cost_price', 
      'stock', 'category_id', 'brand_id', 'supplier_id', 'status'
    ],
    include_deleted = false,
    _userId
  } = params;
  
  try {
    const productRepo = AppDataSource.getRepository(Product);
    
    // Build query
    const queryBuilder = productRepo.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.supplier', 'supplier');
    
    if (!include_deleted) {
      queryBuilder.where('product.is_deleted = :isDeleted', { isDeleted: false });
    }
    
    // Apply filters
    // @ts-ignore
    if (filters.status) {
      // @ts-ignore
      queryBuilder.andWhere('product.status = :status', { status: filters.status });
    }
    
    // @ts-ignore
    if (filters.is_active !== undefined) {
      // @ts-ignore
      queryBuilder.andWhere('product.is_active = :is_active', { is_active: filters.is_active });
    }
    
    // @ts-ignore
    if (filters.category_id) {
      // @ts-ignore
      queryBuilder.andJoin('product.category_id = :category_id', { category_id: filters.category_id });
    }
    
    // @ts-ignore
    if (filters.search) {
      queryBuilder.andWhere(
        '(product.name LIKE :search OR product.sku LIKE :search)',
        // @ts-ignore
        { search: `%${filters.search}%` }
      );
    }
    
    // Get products
    const products = await queryBuilder.getMany();
    
    if (products.length === 0) {
      return {
        status: false,
        message: "No products found to export",
        data: null,
      };
    }
    
    // Prepare data for export
    const exportData = products.map(product => {
      const row = {};
      
      fields.forEach(field => {
        if (field.includes('.')) {
          // Handle nested fields (e.g., 'category.name')
          const [parent, child] = field.split('.');
          // @ts-ignore
          row[field] = product[parent] ? product[parent][child] : '';
        } else {
          // @ts-ignore
          row[field] = product[field];
        }
      });
      
      // Add computed fields
      if (fields.includes('profit_margin') && product.cost_price) {
        // @ts-ignore
        row.profit_margin = ((product.selling_price - product.cost_price) / product.cost_price * 100).toFixed(2);
      }
      
      if (fields.includes('available_stock')) {
        // @ts-ignore
        row.available_stock = Math.max(0, product.stock - (product.reserved_stock || 0));
      }
      
      if (fields.includes('stock_status')) {
        // @ts-ignore
        if (product.stock <= 0) row.stock_status = 'out_of_stock';
        // @ts-ignore
        else if (product.stock <= product.min_stock_level) row.stock_status = 'low_stock';
        else row.stock_status = 'in_stock';
      }
      
      return row;
    });
    
    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `products_export_${timestamp}`;
    
    let fileContent, mimeType, extension;
    
    switch (export_type) {
      case 'csv':
        fileContent = convertToCSV(exportData);
        mimeType = 'text/csv';
        extension = 'csv';
        break;
        
      case 'excel':
        const workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.json_to_sheet(exportData);
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Products');
        
        // Create temp file
        const tempDir = path.join(__dirname, '../../../../temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const tempFile = path.join(tempDir, `${filename}.xlsx`);
        xlsx.writeFile(workbook, tempFile);
        
        fileContent = fs.readFileSync(tempFile);
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        extension = 'xlsx';
        
        // Clean up temp file after reading
        fs.unlinkSync(tempFile);
        break;
        
      case 'json':
        fileContent = JSON.stringify(exportData, null, 2);
        mimeType = 'application/json';
        extension = 'json';
        break;
        
      default:
        return {
          status: false,
          message: `Unsupported export type: ${export_type}`,
          data: null,
        };
    }
    
    // Convert to base64 for transmission
    const base64Content = Buffer.from(fileContent).toString('base64');
    
    // Generate export summary
    const summary = {
      export_date: new Date(),
      export_type,
      products_exported: products.length,
      fields_included: fields,
      filters_applied: Object.keys(filters).length > 0 ? filters : 'none',
      file_info: {
        filename: `${filename}.${extension}`,
        mime_type: mimeType,
        size_bytes: Buffer.byteLength(fileContent),
      },
    };
    
    // Log export activity
    if (_userId) {
      const activityRepo = AppDataSource.getRepository(require("../../../entities/UserActivity"));
      
      await activityRepo.save({
        user_id: _userId,
        action: "product_export",
        entity: "Product",
        entity_id: null,
        description: `Exported ${products.length} products to ${export_type}`,
        details: JSON.stringify(summary),
      });
    }
    
    return {
      status: true,
      message: `Exported ${products.length} products successfully`,
      data: {
        file_content: base64Content,
        file_name: `${filename}.${extension}`,
        mime_type: mimeType,
        summary,
        preview: exportData.slice(0, 5), // First 5 rows as preview
      },
    };
    
  } catch (error) {
    console.error("Export products error:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to export products",
      data: null,
    };
  }
};

// Helper function to convert to CSV
// @ts-ignore
function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    // @ts-ignore
    ...data.map(row => 
      headers.map(header => {
        const cell = row[header];
        // Escape quotes and wrap in quotes if contains comma or quotes
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell !== undefined && cell !== null ? cell : '';
      }).join(',')
    ),
  ];
  
  return csvRows.join('\n');
}