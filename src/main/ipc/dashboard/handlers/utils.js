// dashboard/handlers/utils.js
module.exports = {
  calculateStockUrgency(currentStock, minStock) {
    if (currentStock === 0) return 'critical';
    if (currentStock <= minStock) return 'warning';
    if (currentStock <= minStock * 2) return 'attention';
    return 'normal';
  },

  calculateChange(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  },

  getBusiestDay(hourlyPattern) {
    const dayTotals = {};
    
    hourlyPattern.forEach(item => {
      if (!dayTotals[item.day]) {
        dayTotals[item.day] = { revenue: 0, transactions: 0 };
      }
      dayTotals[item.day].revenue += parseInt(item.totalRevenue);
      dayTotals[item.day].transactions += parseInt(item.transactionCount);
    });

    let busiestDay = { day: '', stats: { revenue: 0, transactions: 0 } };
    
    Object.entries(dayTotals).forEach(([day, stats]) => {
      if (stats.revenue > busiestDay.stats.revenue) {
        busiestDay = { day, stats };
      }
    });

    return busiestDay;
  },

  async getDashboardAlerts(repositories) {
    const { product: productRepo, syncData: syncDataRepo, sales: salesRepo } = repositories;
    const alerts = [];
    
    // Check for low stock
    const lowStockCount = await productRepo.createQueryBuilder("product")
      .where("product.stock <= product.min_stock")
      .andWhere("product.stock > 0")
      .andWhere("product.is_active = :active", { active: true })
      .getCount();
    
    if (lowStockCount > 0) {
      alerts.push({
        type: 'warning',
        message: `${lowStockCount} products are low in stock`,
        icon: 'exclamation-triangle',
        priority: 2,
        link: '/inventory/low-stock'
      });
    }

    // Check for out of stock
    const outOfStockCount = await productRepo.createQueryBuilder("product")
      .where("product.stock = 0")
      .andWhere("product.is_active = :active", { active: true })
      .getCount();
    
    if (outOfStockCount > 0) {
      alerts.push({
        type: 'danger',
        message: `${outOfStockCount} products are out of stock`,
        icon: 'times-circle',
        priority: 1,
        link: '/inventory/out-of-stock'
      });
    }

    // Check for failed syncs in last 24 hours
    const failedSyncs = await syncDataRepo.createQueryBuilder("sync")
      .where("sync.status = :status", { status: 'failed' })
      .andWhere("sync.createdAt >= :recent", { 
        recent: new Date(Date.now() - 24 * 60 * 60 * 1000)
      })
      .getCount();
    
    if (failedSyncs > 0) {
      alerts.push({
        type: 'danger',
        message: `${failedSyncs} sync operations failed in the last 24 hours`,
        icon: 'sync-alt',
        priority: 1,
        link: '/system/sync-status'
      });
    }

    // Check for expiring batches (if applicable)
    const expiringBatches = await module.exports.checkExpiringBatches(repositories);
    if (expiringBatches > 0) {
      alerts.push({
        type: 'warning',
        message: `${expiringBatches} batches expiring soon`,
        icon: 'calendar-times',
        priority: 2,
        link: '/inventory/expiring'
      });
    }

    // Check for slow sales day
    const isSlowDay = await module.exports.checkSlowSalesDay(repositories);
    if (isSlowDay) {
      alerts.push({
        type: 'info',
        message: 'Today\'s sales are below average',
        icon: 'chart-line',
        priority: 3,
        link: '/dashboard/sales'
      });
    }

    // Sort alerts by priority (1 = highest)
    return alerts.sort((a, b) => a.priority - b.priority);
  },

  async checkExpiringBatches(repositories) {
    const { inventory: inventoryRepo } = repositories;
    const thresholdDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days ahead
    
    try {
      const expiringCount = await inventoryRepo.createQueryBuilder("log")
        .where("log.expiry_date IS NOT NULL")
        .andWhere("log.expiry_date <= :threshold", { threshold: thresholdDate })
        .andWhere("log.expiry_date >= :now", { now: new Date() })
        .getCount();
      
      return expiringCount;
    } catch (error) {
      console.error('Error checking expiring batches:', error);
      return 0;
    }
  },

  async checkSlowSalesDay(repositories) {
    const { sales: salesRepo } = repositories;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    
    // Get today's sales
    const todaySales = await salesRepo.createQueryBuilder("sale")
      .select("COUNT(*) as count")
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime >= :start", { start: todayStart })
      .getRawOne();

    // Get yesterday's sales at same time
    const currentHour = now.getHours();
    const yesterdaySameTime = new Date(yesterdayStart.getTime() + (currentHour * 60 * 60 * 1000));
    
    const yesterdaySalesSameTime = await salesRepo.createQueryBuilder("sale")
      .select("COUNT(*) as count")
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime >= :start AND sale.datetime <= :end", {
        start: yesterdayStart,
        end: yesterdaySameTime
      })
      .getRawOne();

    const todayCount = parseInt(todaySales?.count) || 0;
    const yesterdayCount = parseInt(yesterdaySalesSameTime?.count) || 0;
    
    // Consider it slow if sales are less than 50% of yesterday's same period
    return todayCount > 0 && yesterdayCount > 0 && (todayCount / yesterdayCount) < 0.5;
  },

  formatCurrency(amount, currency = 'PHP') {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  },

  formatNumber(number, decimals = 0) {
    return new Intl.NumberFormat('en-PH', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(number);
  },

  formatDate(date, format = 'short') {
    const d = new Date(date);
    
    switch (format) {
      case 'short':
        return d.toLocaleDateString('en-PH');
      case 'long':
        return d.toLocaleDateString('en-PH', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      case 'datetime':
        return d.toLocaleString('en-PH');
      case 'time':
        return d.toLocaleTimeString('en-PH', {
          hour: '2-digit',
          minute: '2-digit'
        });
      default:
        return d.toISOString().split('T')[0];
    }
  },

  calculateAge(dateString) {
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  },

  calculatePercentage(part, total) {
    if (total === 0) return 0;
    return (part / total) * 100;
  },

  generateRandomId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  },

  truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  isValidPhone(phone) {
    const re = /^[\+]?[1-9][\d]{0,15}$/;
    return re.test(phone.replace(/[\s\-\(\)]/g, ''));
  },

  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  groupBy(array, key) {
    return array.reduce((result, item) => {
      const groupKey = item[key];
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    }, {});
  },

  sortBy(array, key, direction = 'asc') {
    return array.sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  },

  filterBy(array, key, value) {
    return array.filter(item => item[key] === value);
  },

  findMax(array, key) {
    return Math.max(...array.map(item => item[key]));
  },

  findMin(array, key) {
    return Math.min(...array.map(item => item[key]));
  },

  calculateAverage(array, key) {
    if (array.length === 0) return 0;
    const sum = array.reduce((total, item) => total + item[key], 0);
    return sum / array.length;
  },

  calculateSum(array, key) {
    return array.reduce((total, item) => total + item[key], 0);
  },

  // Date utilities
  getStartOfDay(date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  },

  getEndOfDay(date = new Date()) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  },

  getStartOfWeek(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  },

  getStartOfMonth(date = new Date()) {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  },

  getStartOfYear(date = new Date()) {
    const d = new Date(date);
    return new Date(d.getFullYear(), 0, 1);
  },

  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  addMonths(date, months) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  },

  addYears(date, years) {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + years);
    return result;
  },

  getDaysBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  // Business logic utilities
  calculateProfit(sellingPrice, costPrice, quantity = 1) {
    return (sellingPrice - costPrice) * quantity;
  },

  calculateProfitMargin(sellingPrice, costPrice) {
    if (sellingPrice === 0) return 0;
    return ((sellingPrice - costPrice) / sellingPrice) * 100;
  },

  calculateMarkup(costPrice, sellingPrice) {
    if (costPrice === 0) return 0;
    return ((sellingPrice - costPrice) / costPrice) * 100;
  },

  calculateDiscount(originalPrice, discountedPrice) {
    if (originalPrice === 0) return 0;
    return ((originalPrice - discountedPrice) / originalPrice) * 100;
  },

  calculateTax(amount, taxRate) {
    return amount * (taxRate / 100);
  },

  calculateWithTax(amount, taxRate) {
    return amount + (amount * (taxRate / 100));
  },

  // Inventory utilities
  calculateReorderPoint(averageDailySales, leadTimeDays, safetyStock = 0) {
    return (averageDailySales * leadTimeDays) + safetyStock;
  },

  calculateSafetyStock(maxDailySales, averageDailySales, leadTimeDays) {
    return (maxDailySales - averageDailySales) * leadTimeDays;
  },

  calculateEOQ(demand, orderingCost, holdingCost) {
    if (holdingCost === 0) return 0;
    return Math.sqrt((2 * demand * orderingCost) / holdingCost);
  }
};