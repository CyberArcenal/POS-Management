// price-history.ts - Frontend API for Price History
export interface PriceHistory {
  id: number;
  product_id: number;
  old_price: number;
  new_price: number;
  change_type: string;
  change_reason: string | null;
  effective_date: string;
  changed_by_id: number | null;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
  product?: {
    id: number;
    sku: string;
    name: string;
  };
  changed_by?: {
    id: number;
    username: string;
    display_name?: string;
  };
}

export interface PriceStatistics {
  total_changes: string;
  min_price: string;
  max_price: string;
  avg_old_price: string;
  avg_new_price: string;
  latest_change: PriceHistory | null;
}

export interface BulkUpdateItem {
  productId: number;
  newPrice: number;
  oldPrice?: number;
}

export interface BulkUpdateResult {
  results: Array<{
    productId: number;
    success: boolean;
    oldPrice: number;
    newPrice: number;
  }>;
  errors: Array<{
    productId: number;
    error: string;
  }>;
}

export interface PriceChangeParams {
  productId: number;
  oldPrice: number;
  newPrice: number;
  changeType?: 'manual' | 'discount' | 'promotion' | 'cost_based' | 'seasonal' | 'bulk' | 'revert';
  changeReason?: string;
  referenceId?: string | number;
  referenceType?: string;
  changedById?: number;
}

export interface PriceHistoryFilters {
  productId?: number;
  startDate?: string;
  endDate?: string;
  changeType?: string;
}

export interface PriceHistoryResponse {
  status: boolean;
  message: string;
  data: PriceHistory[];
}

export interface PriceStatisticsResponse {
  status: boolean;
  message: string;
  data: PriceStatistics;
}

export interface BulkUpdateResponse {
  status: boolean;
  message: string;
  data: BulkUpdateResult;
}

export interface SinglePriceHistoryResponse {
  status: boolean;
  message: string;
  data: PriceHistory;
}

export interface PriceHistoryPayload {
  method: string;
  params?: Record<string, any>;
}

class PriceHistoryAPI {
  // 🔎 READ OPERATIONS

  /**
   * Get price history for a specific product
   */
  async getPriceHistoryByProduct(
    productId: number,
    limit: number = 50
  ): Promise<PriceHistoryResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.priceHistory) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.priceHistory({
        method: "getPriceHistoryByProduct",
        params: { productId, limit },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get price history by product");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get price history by product");
    }
  }

  /**
   * Get price changes within a date range
   */
  async getPriceHistoryByDateRange(
    startDate: string,
    endDate: string,
    productId?: number
  ): Promise<PriceHistoryResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.priceHistory) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.priceHistory({
        method: "getPriceHistoryByDateRange",
        params: { startDate, endDate, productId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get price history by date range");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get price history by date range");
    }
  }

  /**
   * Get most recent price changes
   */
  async getRecentPriceChanges(
    limit: number = 20
  ): Promise<PriceHistoryResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.priceHistory) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.priceHistory({
        method: "getRecentPriceChanges",
        params: { limit },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get recent price changes");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get recent price changes");
    }
  }

  /**
   * Get price changes by type (manual, discount, promotion, etc.)
   */
  async getPriceChangesByType(
    changeType: string,
    limit: number = 50
  ): Promise<PriceHistoryResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.priceHistory) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.priceHistory({
        method: "getPriceChangesByType",
        params: { changeType, limit },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get price changes by type");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get price changes by type");
    }
  }

  /**
   * Get price statistics for a product
   */
  async getPriceStatistics(
    productId: number
  ): Promise<PriceStatisticsResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.priceHistory) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.priceHistory({
        method: "getPriceStatistics",
        params: { productId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get price statistics");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get price statistics");
    }
  }

  // ✏️ WRITE OPERATIONS

  /**
   * Log a price change
   */
  async logPriceChange(
    params: PriceChangeParams
  ): Promise<SinglePriceHistoryResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.priceHistory) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.priceHistory({
        method: "logPriceChange",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to log price change");
    } catch (error: any) {
      throw new Error(error.message || "Failed to log price change");
    }
  }

  /**
   * Bulk update prices for multiple products
   */
  async bulkUpdatePrices(
    priceUpdates: BulkUpdateItem[],
    changeType: string = "bulk",
    changeReason: string = "Bulk price update"
  ): Promise<BulkUpdateResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.priceHistory) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.priceHistory({
        method: "bulkUpdatePrices",
        params: { priceUpdates, changeType, changeReason },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to bulk update prices");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk update prices");
    }
  }

  /**
   * Revert to a previous price
   */
  async revertPriceChange(
    priceHistoryId: number,
    reason: string = "Reverted to previous price"
  ): Promise<SinglePriceHistoryResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.priceHistory) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.priceHistory({
        method: "revertPriceChange",
        params: { priceHistoryId, reason },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to revert price change");
    } catch (error: any) {
      throw new Error(error.message || "Failed to revert price change");
    }
  }

  // 🔧 UTILITY METHODS

  /**
   * Get current price for a product
   */
  async getCurrentPrice(productId: number): Promise<number | null> {
    try {
      const response = await this.getPriceHistoryByProduct(productId, 1);
      if (response.status && response.data.length > 0) {
        return response.data[0].new_price;
      }
      return null;
    } catch (error) {
      console.error("Error getting current price:", error);
      return null;
    }
  }

  /**
   * Get price history for multiple products
   */
  async getBatchPriceHistory(
    productIds: number[],
    limitPerProduct: number = 10
  ): Promise<Record<number, PriceHistory[]>> {
    try {
      const promises = productIds.map(productId =>
        this.getPriceHistoryByProduct(productId, limitPerProduct)
      );
      
      const results = await Promise.allSettled(promises);
      
      const priceHistoryMap: Record<number, PriceHistory[]> = {};
      
      results.forEach((result, index) => {
        const productId = productIds[index];
        if (result.status === 'fulfilled' && result.value.status) {
          priceHistoryMap[productId] = result.value.data;
        } else {
          priceHistoryMap[productId] = [];
        }
      });
      
      return priceHistoryMap;
    } catch (error) {
      console.error("Error getting batch price history:", error);
      return {};
    }
  }

  /**
   * Get price change summary for a product
   */
  async getProductPriceSummary(productId: number): Promise<{
    currentPrice: number | null;
    originalPrice: number | null;
    totalChanges: number;
    lastChangeDate: string | null;
    priceDifference: number | null;
    percentageChange: number | null;
  }> {
    try {
      const [historyResponse, statsResponse] = await Promise.all([
        this.getPriceHistoryByProduct(productId, 100),
        this.getPriceStatistics(productId)
      ]);

      if (!historyResponse.status || !statsResponse.status) {
        throw new Error("Failed to get price summary");
      }

      const history = historyResponse.data;
      const stats = statsResponse.data;
      
      const currentPrice = history.length > 0 ? history[0].new_price : null;
      const originalPrice = history.length > 0 ? 
        history[history.length - 1].old_price : null;
      
      let priceDifference = null;
      let percentageChange = null;
      
      if (currentPrice !== null && originalPrice !== null && originalPrice > 0) {
        priceDifference = currentPrice - originalPrice;
        percentageChange = (priceDifference / originalPrice) * 100;
      }

      return {
        currentPrice,
        originalPrice,
        totalChanges: parseInt(stats.total_changes) || 0,
        lastChangeDate: stats.latest_change?.effective_date || null,
        priceDifference,
        percentageChange
      };
    } catch (error) {
      console.error("Error getting product price summary:", error);
      return {
        currentPrice: null,
        originalPrice: null,
        totalChanges: 0,
        lastChangeDate: null,
        priceDifference: null,
        percentageChange: null
      };
    }
  }

  /**
   * Get price timeline for visualization
   */
  async getPriceTimeline(
    productId: number,
    daysBack: number = 30
  ): Promise<Array<{ date: string; price: number }>> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);
      
      const response = await this.getPriceHistoryByDateRange(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        productId
      );
      
      if (response.status) {
        // Sort by effective date and remove duplicates for same day
        const timelineMap = new Map<string, number>();
        
        response.data
          .sort((a, b) => 
            new Date(a.effective_date).getTime() - new Date(b.effective_date).getTime()
          )
          .forEach(item => {
            const date = new Date(item.effective_date).toISOString().split('T')[0];
            timelineMap.set(date, item.new_price);
          });
        
        return Array.from(timelineMap.entries()).map(([date, price]) => ({
          date,
          price
        }));
      }
      
      return [];
    } catch (error) {
      console.error("Error getting price timeline:", error);
      return [];
    }
  }

  /**
   * Check for price anomalies (significant changes)
   */
  async detectPriceAnomalies(
    productId: number,
    thresholdPercentage: number = 20
  ): Promise<Array<{
    change: PriceHistory;
    percentageChange: number;
    isAnomaly: boolean;
  }>> {
    try {
      const response = await this.getPriceHistoryByProduct(productId, 50);
      
      if (!response.status) {
        return [];
      }
      
      const anomalies: Array<{
        change: PriceHistory;
        percentageChange: number;
        isAnomaly: boolean;
      }> = [];
      
      for (let i = 0; i < response.data.length; i++) {
        const change = response.data[i];
        const percentageChange = ((change.new_price - change.old_price) / change.old_price) * 100;
        const isAnomaly = Math.abs(percentageChange) > thresholdPercentage;
        
        anomalies.push({
          change,
          percentageChange,
          isAnomaly
        });
      }
      
      return anomalies;
    } catch (error) {
      console.error("Error detecting price anomalies:", error);
      return [];
    }
  }

  /**
   * Calculate price volatility
   */
  async calculatePriceVolatility(productId: number): Promise<{
    volatility: number;
    averageChange: number;
    maxIncrease: number;
    maxDecrease: number;
  }> {
    try {
      const response = await this.getPriceHistoryByProduct(productId, 100);
      
      if (!response.status || response.data.length < 2) {
        return {
          volatility: 0,
          averageChange: 0,
          maxIncrease: 0,
          maxDecrease: 0
        };
      }
      
      const changes: number[] = [];
      let maxIncrease = 0;
      let maxDecrease = 0;
      
      response.data.forEach(change => {
        const changeAmount = change.new_price - change.old_price;
        const percentageChange = (changeAmount / change.old_price) * 100;
        
        changes.push(percentageChange);
        
        if (percentageChange > maxIncrease) {
          maxIncrease = percentageChange;
        }
        if (percentageChange < maxDecrease) {
          maxDecrease = percentageChange;
        }
      });
      
      const averageChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
      
      // Calculate volatility as standard deviation of percentage changes
      const squaredDifferences = changes.map(change => 
        Math.pow(change - averageChange, 2)
      );
      const variance = squaredDifferences.reduce((sum, sqDiff) => sum + sqDiff, 0) / changes.length;
      const volatility = Math.sqrt(variance);
      
      return {
        volatility,
        averageChange,
        maxIncrease,
        maxDecrease
      };
    } catch (error) {
      console.error("Error calculating price volatility:", error);
      return {
        volatility: 0,
        averageChange: 0,
        maxIncrease: 0,
        maxDecrease: 0
      };
    }
  }

  /**
   * Export price history to CSV
   */
  exportToCSV(priceHistory: PriceHistory[], includeProductInfo: boolean = true): string {
    const headers = [
      'ID',
      'Date',
      'Time',
      'Product SKU',
      'Product Name',
      'Old Price',
      'New Price',
      'Change',
      'Percentage Change',
      'Change Type',
      'Change Reason',
      'Changed By'
    ];

    const rows = priceHistory.map(history => {
      const date = new Date(history.effective_date);
      const formattedDate = date.toLocaleDateString();
      const formattedTime = date.toLocaleTimeString();
      const change = history.new_price - history.old_price;
      const percentageChange = history.old_price > 0 ? 
        ((change / history.old_price) * 100).toFixed(2) + '%' : 'N/A';
      
      return [
        history.id,
        formattedDate,
        formattedTime,
        includeProductInfo ? history.product?.sku || '' : '',
        includeProductInfo ? history.product?.name || '' : '',
        history.old_price.toFixed(2),
        history.new_price.toFixed(2),
        change.toFixed(2),
        percentageChange,
        history.change_type,
        history.change_reason || '',
        history.changed_by?.username || 'System'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Download price history as CSV file
   */
  downloadPriceHistoryAsCSV(
    priceHistory: PriceHistory[], 
    filename: string = 'price-history.csv',
    includeProductInfo: boolean = true
  ): void {
    const csvContent = this.exportToCSV(priceHistory, includeProductInfo);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  /**
   * Create a price change with validation
   */
  async createPriceChangeWithValidation(
    productId: number,
    newPrice: number,
    options?: {
      changeType?: string;
      changeReason?: string;
      validateThreshold?: number; // percentage threshold for validation
    }
  ): Promise<SinglePriceHistoryResponse> {
    try {
      // Get current price
      const currentPrice = await this.getCurrentPrice(productId);
      
      if (currentPrice === null) {
        throw new Error("Could not retrieve current price");
      }
      
      // Validate price change threshold if specified
      if (options?.validateThreshold) {
        const percentageChange = Math.abs((newPrice - currentPrice) / currentPrice) * 100;
        if (percentageChange > options.validateThreshold) {
          throw new Error(
            `Price change exceeds threshold of ${options.validateThreshold}% ` +
            `(current: ${currentPrice}, new: ${newPrice}, change: ${percentageChange.toFixed(2)}%)`
          );
        }
      }
      
      // Log the price change
      return await this.logPriceChange({
        productId,
        oldPrice: currentPrice,
        newPrice,
        changeType: options?.changeType as "revert" | "manual" | "discount" | "promotion" | "cost_based" | "seasonal" || 'manual',
        changeReason: options?.changeReason || 'Price adjustment'
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to create price change with validation");
    }
  }

  /**
   * Get price change suggestions based on cost and margin
   */
  async getPriceSuggestions(
    productId: number,
    targetMargin: number = 30 // 30% target margin
  ): Promise<{
    currentPrice: number | null;
    costPrice: number | null;
    suggestedPrice: number | null;
    currentMargin: number | null;
    targetMargin: number;
  }> {
    try {
      // Note: This assumes you have access to product cost price
      // You might need to adjust this based on your data structure
      
      // Get current price
      const currentPrice = await this.getCurrentPrice(productId);
      
      // For this example, we'll assume we get cost price from a different API
      // You should implement this based on your actual product data structure
      const costPrice = null; // Get from your product API
      
      let suggestedPrice = null;
      let currentMargin = null;
      
      if (currentPrice !== null && costPrice !== null && costPrice > 0) {
        currentMargin = ((currentPrice - costPrice) / currentPrice) * 100;
        suggestedPrice = costPrice / (1 - (targetMargin / 100));
      }
      
      return {
        currentPrice,
        costPrice,
        suggestedPrice,
        currentMargin,
        targetMargin
      };
    } catch (error) {
      console.error("Error getting price suggestions:", error);
      return {
        currentPrice: null,
        costPrice: null,
        suggestedPrice: null,
        currentMargin: null,
        targetMargin
      };
    }
  }
}

const priceHistoryAPI = new PriceHistoryAPI();

export default priceHistoryAPI;