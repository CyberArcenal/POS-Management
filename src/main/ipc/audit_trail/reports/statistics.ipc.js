// audit_trail/reports/statistics.ipc.js
//@ts-check
const AuditTrail = require("../../../../entities/AuditTrail");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {Object} filters
 * @param {number} userId
 */
async function getAuditStatistics(filters = {}, userId) {
  try {
    const auditRepo = AppDataSource.getRepository(AuditTrail);

    // Get date range (default to last 90 days)
    // @ts-ignore
    const endDate = filters.end_date ? new Date(filters.end_date) : new Date();
    // @ts-ignore
    const startDate = filters.start_date ? new Date(filters.start_date) : new Date();
    startDate.setDate(startDate.getDate() - 90);

    // Build query for all audits
    const queryBuilder = auditRepo
      .createQueryBuilder("audit")
      .leftJoinAndSelect("audit.user", "user")
      .where("audit.timestamp BETWEEN :start_date AND :end_date", {
        start_date: startDate,
        end_date: endDate,
      });

    // Apply additional filters
    // @ts-ignore
    if (filters.entity) {
      // @ts-ignore
      queryBuilder.andWhere("audit.entity = :entity", { entity: filters.entity });
    }

    // @ts-ignore
    if (filters.action) {
      // @ts-ignore
      queryBuilder.andWhere("audit.action = :action", { action: filters.action });
    }

    // @ts-ignore
    if (filters.user_id) {
      // @ts-ignore
      queryBuilder.andWhere("audit.user_id = :user_id", { user_id: filters.user_id });
    }

    const audits = await queryBuilder.getMany();

    if (audits.length === 0) {
      return {
        status: true,
        message: "No audit data found for the specified period",
        data: {
          period: {
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            // @ts-ignore
            days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
          },
          summary: {
            total_audits: 0,
            total_entities: 0,
            total_users: 0,
            total_actions: 0,
          },
          statistics: {},
          trends: {},
          comparisons: {},
          recommendations: [],
        },
      };
    }

    // Calculate comprehensive statistics
    const stats = calculateAuditStatistics(audits, startDate, endDate);

    // Generate trends
    const trends = calculateAuditTrends(audits, startDate, endDate);

    // Generate comparisons
    const comparisons = generateAuditComparisons(stats, trends);

    // Generate recommendations
    const recommendations = generateAuditRecommendations(stats, trends);

    await log_audit("statistics_report", "AuditTrail", 0, userId, {
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
      total_audits: audits.length,
    });

    return {
      status: true,
      message: "Audit statistics generated successfully",
      data: {
        report_period: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          days: stats.period_days,
        },
        summary: {
          total_audits: stats.total_audits,
          total_entities: stats.unique_entities,
          total_users: stats.unique_users,
          total_actions: stats.unique_actions,
          period_days: stats.period_days,
        },
        statistics: stats,
        trends: trends,
        comparisons: comparisons,
        recommendations: recommendations,
        filters_applied: filters,
      },
    };
  } catch (error) {
    console.error("getAuditStatistics error:", error);

    await log_audit("error", "AuditTrail", 0, userId, {
      action: "statistics_report",
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to generate audit statistics: ${error.message}`,
      data: null,
    };
  }
}

/**
 * Calculate comprehensive audit statistics
 * @param {any[]} audits
 * @param {number | Date} startDate
 * @param {number | Date} endDate
 */
function calculateAuditStatistics(audits, startDate, endDate) {
  // @ts-ignore
  const periodDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

  // Basic counts
  const stats = {
    total_audits: audits.length,
    unique_entities: new Set(audits.map((/** @type {{ entity: any; }} */ a) => a.entity)).size,
    unique_users: new Set(audits.map((/** @type {{ user_id: any; }} */ a) => a.user_id)).size,
    unique_actions: new Set(audits.map((/** @type {{ action: any; }} */ a) => a.action)).size,
    period_days: periodDays,
  };

  // Volume statistics
  // @ts-ignore
  stats.average_daily_audits = stats.total_audits / periodDays;
  // @ts-ignore
  stats.audits_per_user = stats.total_audits / Math.max(1, stats.unique_users);
  // @ts-ignore
  stats.audits_per_entity = stats.total_audits / Math.max(1, stats.unique_entities);

  // Action type breakdown
  // @ts-ignore
  stats.action_breakdown = {};
  audits.forEach((/** @type {{ action: string | number; timestamp: number; entity: any; user_id: any; }} */ audit) => {
    // @ts-ignore
    if (!stats.action_breakdown[audit.action]) {
      // @ts-ignore
      stats.action_breakdown[audit.action] = {
        count: 0,
        entities: new Set(),
        users: new Set(),
        first_audit: audit.timestamp,
        last_audit: audit.timestamp,
      };
    }
    
    // @ts-ignore
    const breakdown = stats.action_breakdown[audit.action];
    breakdown.count++;
    breakdown.entities.add(audit.entity);
    breakdown.users.add(audit.user_id);
    
    if (audit.timestamp < breakdown.first_audit) {
      breakdown.first_audit = audit.timestamp;
    }
    if (audit.timestamp > breakdown.last_audit) {
      breakdown.last_audit = audit.timestamp;
    }
  });

  // Convert Sets to counts
  // @ts-ignore
  Object.keys(stats.action_breakdown).forEach(action => {
    // @ts-ignore
    const breakdown = stats.action_breakdown[action];
    breakdown.unique_entities = breakdown.entities.size;
    breakdown.unique_users = breakdown.users.size;
    breakdown.percentage_of_total = (breakdown.count / stats.total_audits) * 100;
    breakdown.average_per_day = breakdown.count / periodDays;
    delete breakdown.entities;
    delete breakdown.users;
  });

  // Entity breakdown
  // @ts-ignore
  stats.entity_breakdown = {};
  audits.forEach((/** @type {{ entity: string | number; timestamp: number; action: any; user_id: any; }} */ audit) => {
    // @ts-ignore
    if (!stats.entity_breakdown[audit.entity]) {
      // @ts-ignore
      stats.entity_breakdown[audit.entity] = {
        entity: audit.entity,
        audits: 0,
        actions: new Set(),
        users: new Set(),
        first_audit: audit.timestamp,
        last_audit: audit.timestamp,
      };
    }
    
    // @ts-ignore
    const breakdown = stats.entity_breakdown[audit.entity];
    breakdown.audits++;
    breakdown.actions.add(audit.action);
    breakdown.users.add(audit.user_id);
    
    if (audit.timestamp < breakdown.first_audit) {
      breakdown.first_audit = audit.timestamp;
    }
    if (audit.timestamp > breakdown.last_audit) {
      breakdown.last_audit = audit.timestamp;
    }
  });

  // Convert Sets to counts
  // @ts-ignore
  Object.keys(stats.entity_breakdown).forEach(entity => {
    // @ts-ignore
    const breakdown = stats.entity_breakdown[entity];
    breakdown.unique_actions = breakdown.actions.size;
    breakdown.unique_users = breakdown.users.size;
    breakdown.percentage_of_total = (breakdown.audits / stats.total_audits) * 100;
    breakdown.average_per_day = breakdown.audits / periodDays;
    delete breakdown.actions;
    delete breakdown.users;
  });

  // User activity breakdown
  // @ts-ignore
  stats.user_activity = {};
  audits.forEach((/** @type {{ user: { username: any; }; user_id: any; timestamp: number; entity: any; action: any; }} */ audit) => {
    if (!audit.user) return;
    
    const userId = audit.user_id;
    // @ts-ignore
    if (!stats.user_activity[userId]) {
      // @ts-ignore
      stats.user_activity[userId] = {
        user_id: userId,
        username: audit.user.username,
        audits: 0,
        entities: new Set(),
        actions: new Set(),
        first_audit: audit.timestamp,
        last_audit: audit.timestamp,
        days_active: new Set(),
      };
    }
    
    // @ts-ignore
    const userStats = stats.user_activity[userId];
    userStats.audits++;
    userStats.entities.add(audit.entity);
    userStats.actions.add(audit.action);
    // @ts-ignore
    userStats.days_active.add(audit.timestamp.toISOString().split('T')[0]);
    
    if (audit.timestamp < userStats.first_audit) {
      userStats.first_audit = audit.timestamp;
    }
    if (audit.timestamp > userStats.last_audit) {
      userStats.last_audit = audit.timestamp;
    }
  });

  // Convert Sets to counts and calculate metrics
  // @ts-ignore
  Object.keys(stats.user_activity).forEach(userId => {
    // @ts-ignore
    const userStats = stats.user_activity[userId];
    userStats.unique_entities = userStats.entities.size;
    userStats.unique_actions = userStats.actions.size;
    userStats.days_active_count = userStats.days_active.size;
    userStats.audits_per_active_day = userStats.audits / userStats.days_active_count;
    userStats.percentage_of_total = (userStats.audits / stats.total_audits) * 100;
    delete userStats.entities;
    delete userStats.actions;
    delete userStats.days_active;
  });

  // Time-based statistics
  const hourlyDistribution = Array(24).fill(0);
  const dayOfWeekDistribution = {
    Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, 
    Thursday: 0, Friday: 0, Saturday: 0
  };
  
  audits.forEach((/** @type {{ timestamp: string | number | Date; }} */ audit) => {
    const date = new Date(audit.timestamp);
    const hour = date.getHours();
    const day = date.toLocaleDateString('en-US', { weekday: 'long' });
    
    hourlyDistribution[hour]++;
    // @ts-ignore
    dayOfWeekDistribution[day]++;
  });

  // @ts-ignore
  stats.time_distribution = {
    hourly: hourlyDistribution,
    daily: dayOfWeekDistribution,
    peak_hour: hourlyDistribution.indexOf(Math.max(...hourlyDistribution)),
    peak_day: Object.entries(dayOfWeekDistribution)
      .reduce((max, [day, count]) => count > max.count ? { day, count } : max, { day: '', count: 0 }).day,
  };

  // Consistency metrics
  const dailyAuditCounts = {};
  audits.forEach((/** @type {{ timestamp: { toISOString: () => string; }; }} */ audit) => {
    const date = audit.timestamp.toISOString().split('T')[0];
    // @ts-ignore
    dailyAuditCounts[date] = (dailyAuditCounts[date] || 0) + 1;
  });

  const dailyCounts = Object.values(dailyAuditCounts);
  const meanDailyAudits = dailyCounts.reduce((sum, count) => sum + count, 0) / dailyCounts.length;
  const variance = dailyCounts.reduce((sum, count) => sum + Math.pow(count - meanDailyAudits, 2), 0) / dailyCounts.length;
  const stdDev = Math.sqrt(variance);
  
  // @ts-ignore
  stats.consistency_metrics = {
    days_with_audits: Object.keys(dailyAuditCounts).length,
    audit_coverage: (Object.keys(dailyAuditCounts).length / periodDays) * 100,
    daily_audit_mean: meanDailyAudits,
    daily_audit_std_dev: stdDev,
    consistency_score: stdDev > 0 ? (1 - (stdDev / meanDailyAudits)) * 100 : 100,
  };

  // Security metrics
  const securityActions = ['access_denied', 'login', 'logout', 'permission_change', 'password_change'];
  const securityAudits = audits.filter((/** @type {{ action: string; }} */ audit) => securityActions.includes(audit.action));
  
  // @ts-ignore
  stats.security_metrics = {
    total_security_audits: securityAudits.length,
    security_audit_percentage: (securityAudits.length / stats.total_audits) * 100,
    security_actions: {},
    unique_security_users: new Set(securityAudits.map((/** @type {{ user_id: any; }} */ a) => a.user_id)).size,
  };

  securityAudits.forEach((/** @type {{ action: string | number; }} */ audit) => {
    // @ts-ignore
    stats.security_metrics.security_actions[audit.action] = 
      // @ts-ignore
      (stats.security_metrics.security_actions[audit.action] || 0) + 1;
  });

  // Error metrics
  const errorAudits = audits.filter((/** @type {{ action: string; }} */ audit) => audit.action === 'error');
  
  // @ts-ignore
  stats.error_metrics = {
    total_error_audits: errorAudits.length,
    error_audit_percentage: (errorAudits.length / stats.total_audits) * 100,
    error_entities: new Set(errorAudits.map((/** @type {{ entity: any; }} */ a) => a.entity)).size,
    error_users: new Set(errorAudits.map((/** @type {{ user_id: any; }} */ a) => a.user_id)).size,
    error_trend: calculateErrorTrend(errorAudits),
  };

  return stats;
}

/**
 * Calculate error trend metrics
 * @param {any[]} errorAudits
 */
function calculateErrorTrend(errorAudits) {
  if (errorAudits.length === 0) {
    return { increasing: false, decreasing: false, stable: true };
  }

  // Group by week
  const weeklyErrors = {};
  errorAudits.forEach((/** @type {{ timestamp: string | number | Date; }} */ audit) => {
    const date = new Date(audit.timestamp);
    const week = `${date.getFullYear()}-W${getWeekNumber(date)}`;
    // @ts-ignore
    weeklyErrors[week] = (weeklyErrors[week] || 0) + 1;
  });

  const weeks = Object.keys(weeklyErrors).sort();
  if (weeks.length < 2) {
    return { increasing: false, decreasing: false, stable: true };
  }

  // @ts-ignore
  const firstWeek = weeklyErrors[weeks[0]];
  // @ts-ignore
  const lastWeek = weeklyErrors[weeks[weeks.length - 1]];
  const trend = lastWeek - firstWeek;

  return {
    increasing: trend > 0,
    decreasing: trend < 0,
    stable: trend === 0,
    trend_value: trend,
    percentage_change: ((lastWeek - firstWeek) / firstWeek) * 100,
  };
}

/**
 * Get ISO week number
 * @param {string | number | Date} date
 */
function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

/**
 * Calculate audit trends
 * @param {any[]} audits
 * @param {string | number | Date} startDate
 * @param {number | Date} endDate
 */
function calculateAuditTrends(audits, startDate, endDate) {
  const trends = {
    daily: {},
    weekly: {},
    monthly: {},
  };

  // Initialize date ranges
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    // @ts-ignore
    trends.daily[dateStr] = {
      date: dateStr,
      audits: 0,
      entities: new Set(),
      users: new Set(),
      actions: new Set(),
    };
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Fill in audit data
  audits.forEach((/** @type {{ timestamp: string | number | Date; entity: any; user_id: any; action: any; }} */ audit) => {
    const date = new Date(audit.timestamp);
    const dateStr = date.toISOString().split('T')[0];
    const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    // Daily trends
    // @ts-ignore
    if (trends.daily[dateStr]) {
      // @ts-ignore
      const daily = trends.daily[dateStr];
      daily.audits++;
      daily.entities.add(audit.entity);
      daily.users.add(audit.user_id);
      daily.actions.add(audit.action);
    }

    // Weekly trends
    // @ts-ignore
    if (!trends.weekly[weekKey]) {
      // @ts-ignore
      trends.weekly[weekKey] = {
        week: weekKey,
        audits: 0,
        entities: new Set(),
        users: new Set(),
        actions: new Set(),
      };
    }
    
    // @ts-ignore
    const weekly = trends.weekly[weekKey];
    weekly.audits++;
    weekly.entities.add(audit.entity);
    weekly.users.add(audit.user_id);
    weekly.actions.add(audit.action);

    // Monthly trends
    // @ts-ignore
    if (!trends.monthly[monthKey]) {
      // @ts-ignore
      trends.monthly[monthKey] = {
        month: monthKey,
        audits: 0,
        entities: new Set(),
        users: new Set(),
        actions: new Set(),
      };
    }
    
    // @ts-ignore
    const monthly = trends.monthly[monthKey];
    monthly.audits++;
    monthly.entities.add(audit.entity);
    monthly.users.add(audit.user_id);
    monthly.actions.add(audit.action);
  });

  // Convert Sets to counts and calculate additional metrics
  Object.keys(trends.daily).forEach(date => {
    // @ts-ignore
    const daily = trends.daily[date];
    daily.unique_entities = daily.entities.size;
    daily.unique_users = daily.users.size;
    daily.unique_actions = daily.actions.size;
    delete daily.entities;
    delete daily.users;
    delete daily.actions;
  });

  Object.keys(trends.weekly).forEach(weekKey => {
    // @ts-ignore
    const weekly = trends.weekly[weekKey];
    weekly.unique_entities = weekly.entities.size;
    weekly.unique_users = weekly.users.size;
    weekly.unique_actions = weekly.actions.size;
    weekly.average_daily_audits = weekly.audits / 7;
    delete weekly.entities;
    delete weekly.users;
    delete weekly.actions;
  });

  Object.keys(trends.monthly).forEach(monthKey => {
    // @ts-ignore
    const monthly = trends.monthly[monthKey];
    monthly.unique_entities = monthly.entities.size;
    monthly.unique_users = monthly.users.size;
    monthly.unique_actions = monthly.actions.size;
    const [year, month] = monthKey.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    monthly.average_daily_audits = monthly.audits / daysInMonth;
    delete monthly.entities;
    delete monthly.users;
    delete monthly.actions;
  });

  // Convert to arrays for easier consumption
  // @ts-ignore
  trends.daily_array = Object.values(trends.daily)
    // @ts-ignore
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // @ts-ignore
  trends.weekly_array = Object.values(trends.weekly)
    .sort((a, b) => a.week.localeCompare(b.week));
  
  // @ts-ignore
  trends.monthly_array = Object.values(trends.monthly)
    .sort((a, b) => a.month.localeCompare(b.month));

  // Calculate growth rates
  // @ts-ignore
  if (trends.daily_array.length >= 2) {
    // @ts-ignore
    const firstDay = trends.daily_array[0];
    // @ts-ignore
    const lastDay = trends.daily_array[trends.daily_array.length - 1];
    
    // @ts-ignore
    trends.growth_rates = {
      daily_audit_growth: ((lastDay.audits - firstDay.audits) / firstDay.audits) * 100,
      daily_entity_growth: ((lastDay.unique_entities - firstDay.unique_entities) / firstDay.unique_entities) * 100,
      daily_user_growth: ((lastDay.unique_users - firstDay.unique_users) / firstDay.unique_users) * 100,
    };
  }

  return trends;
}

/**
 * Generate audit comparisons
 * @param {{ total_audits?: any; unique_entities?: number; unique_users?: number; unique_actions?: number; period_days?: number; action_breakdown?: any; entity_breakdown?: any; user_activity?: any; average_daily_audits?: any; consistency_metrics?: any; }} stats
 * @param {{ daily?: {}; weekly?: {}; monthly?: {}; daily_array?: any; weekly_array?: any; monthly_array?: any; }} trends
 */
function generateAuditComparisons(stats, trends) {
  const comparisons = {
    period_vs_period: {},
    action_comparisons: {},
    entity_comparisons: {},
    user_comparisons: {},
  };

  // Compare current period to previous period (if we had data)
  comparisons.period_vs_period = {
    description: "Comparison would require historical data from previous period",
    available: false,
  };

  // Compare actions
  const actionArray = Object.entries(stats.action_breakdown)
    .map(([action, data]) => ({ action, ...data }))
    .sort((a, b) => b.count - a.count);
  
  if (actionArray.length >= 2) {
    const topAction = actionArray[0];
    const secondAction = actionArray[1];
    
    comparisons.action_comparisons = {
      top_action: topAction.action,
      top_action_percentage: topAction.percentage_of_total,
      second_action: secondAction.action,
      second_action_percentage: secondAction.percentage_of_total,
      difference: topAction.percentage_of_total - secondAction.percentage_of_total,
      count_ratio: topAction.count / secondAction.count,
    };
  }

  // Compare entities
  const entityArray = Object.values(stats.entity_breakdown)
    .sort((a, b) => b.audits - a.audits);
  
  if (entityArray.length >= 2) {
    const topEntity = entityArray[0];
    const secondEntity = entityArray[1];
    
    comparisons.entity_comparisons = {
      top_entity: topEntity.entity,
      top_entity_percentage: topEntity.percentage_of_total,
      second_entity: secondEntity.entity,
      second_entity_percentage: secondEntity.percentage_of_total,
      difference: topEntity.percentage_of_total - secondEntity.percentage_of_total,
      count_ratio: topEntity.audits / secondEntity.audits,
    };
  }

  // Compare users
  const userArray = Object.values(stats.user_activity)
    .sort((a, b) => b.audits - a.audits);
  
  if (userArray.length >= 2) {
    const topUser = userArray[0];
    const secondUser = userArray[1];
    
    comparisons.user_comparisons = {
      top_user_id: topUser.user_id,
      top_user_name: topUser.username,
      top_user_percentage: topUser.percentage_of_total,
      second_user_id: secondUser.user_id,
      second_user_name: secondUser.username,
      second_user_percentage: secondUser.percentage_of_total,
      difference: topUser.percentage_of_total - secondUser.percentage_of_total,
      count_ratio: topUser.audits / secondUser.audits,
    };
  }

  // Daily vs weekly vs monthly comparison
  if (trends.daily_array.length > 0 && trends.weekly_array.length > 0 && trends.monthly_array.length > 0) {
    const avgDailyAudits = stats.average_daily_audits;
    const avgWeeklyAudits = trends.weekly_array.reduce((/** @type {any} */ sum, /** @type {{ audits: any; }} */ week) => sum + week.audits, 0) / trends.weekly_array.length;
    const avgMonthlyAudits = trends.monthly_array.reduce((/** @type {any} */ sum, /** @type {{ audits: any; }} */ month) => sum + month.audits, 0) / trends.monthly_array.length;
    
    // @ts-ignore
    comparisons.time_period_comparisons = {
      daily_to_weekly_ratio: avgDailyAudits * 7 / avgWeeklyAudits,
      weekly_to_monthly_ratio: avgWeeklyAudits * 4.33 / avgMonthlyAudits,
      daily_consistency: stats.consistency_metrics.consistency_score,
      weekly_variation: calculateVariation(trends.weekly_array.map((/** @type {{ audits: any; }} */ w) => w.audits)),
      monthly_variation: calculateVariation(trends.monthly_array.map((/** @type {{ audits: any; }} */ m) => m.audits)),
    };
  }

  return comparisons;
}

/**
 * Calculate variation coefficient
 * @param {any[]} array
 */
function calculateVariation(array) {
  if (array.length === 0) return 0;
  const mean = array.reduce((/** @type {any} */ sum, /** @type {any} */ val) => sum + val, 0) / array.length;
  const variance = array.reduce((/** @type {number} */ sum, /** @type {number} */ val) => sum + Math.pow(val - mean, 2), 0) / array.length;
  const stdDev = Math.sqrt(variance);
  return mean > 0 ? (stdDev / mean) * 100 : 0;
}

/**
 * Generate audit recommendations
 * @param {{ total_audits: any; unique_entities: any; unique_users: any; unique_actions?: number; period_days?: number; average_daily_audits?: any; consistency_metrics?: any; user_activity?: any; action_breakdown?: any; time_distribution?: any; security_metrics?: any; }} stats
 * @param {{ daily?: {}; weekly?: {}; monthly?: {}; growth_rates?: any; }} trends
 */
function generateAuditRecommendations(stats, trends) {
  const recommendations = [];

  // Audit volume recommendations
  if (stats.average_daily_audits < 1) {
    recommendations.push({
      type: 'low_audit_volume',
      message: 'Low audit volume detected. Consider reviewing audit logging configuration.',
      priority: 'medium',
      action: 'Review audit logging configuration and ensure all critical actions are being logged.',
    });
  }

  if (stats.average_daily_audits > 1000) {
    recommendations.push({
      type: 'high_audit_volume',
      message: 'High audit volume detected. Ensure system performance can handle the audit load.',
      priority: 'medium',
      action: 'Consider implementing audit log rotation or archiving strategy.',
    });
  }

  // Consistency recommendations
  if (stats.consistency_metrics.consistency_score < 50) {
    recommendations.push({
      type: 'low_consistency',
      message: 'Low audit consistency across days. Consider standardizing user activities.',
      priority: 'high',
      action: 'Review user activity patterns and implement standardized procedures.',
    });
  }

  // User concentration recommendations
  const userArray = Object.values(stats.user_activity);
  if (userArray.length > 0) {
    const topUser = userArray.reduce((max, user) => user.audits > max.audits ? user : max);
    const userConcentration = (topUser.audits / stats.total_audits) * 100;
    
    if (userConcentration > 50) {
      recommendations.push({
        type: 'high_user_concentration',
        message: `High audit concentration with one user (${userConcentration.toFixed(1)}%). Consider distributing responsibilities.`,
        priority: 'medium',
        action: 'Train additional staff and distribute system responsibilities.',
      });
    }
  }

  // Action type recommendations
  const errorAudits = stats.action_breakdown['error'];
  if (errorAudits && errorAudits.percentage_of_total > 5) {
    recommendations.push({
      type: 'high_error_rate',
      message: `High percentage of error audits (${errorAudits.percentage_of_total.toFixed(1)}%). Investigate system errors.`,
      priority: 'high',
      action: 'Investigate and resolve system errors indicated in audit logs.',
    });
  }

  const accessDeniedAudits = stats.action_breakdown['access_denied'];
  if (accessDeniedAudits && accessDeniedAudits.percentage_of_total > 2) {
    recommendations.push({
      type: 'high_access_denied',
      message: `High percentage of access denied audits (${accessDeniedAudits.percentage_of_total.toFixed(1)}%). Review permissions.`,
      priority: 'high',
      action: 'Review user permissions and access control configuration.',
    });
  }

  // Time distribution recommendations
  if (stats.time_distribution.peak_hour >= 22 || stats.time_distribution.peak_hour <= 6) {
    recommendations.push({
      type: 'off_hours_activity',
      message: `Peak audit activity during off-hours (${stats.time_distribution.peak_hour}:00). Review for suspicious activity.`,
      priority: 'medium',
      action: 'Monitor off-hours activity for security concerns.',
    });
  }

  // Security audit recommendations
  if (stats.security_metrics.security_audit_percentage < 1) {
    recommendations.push({
      type: 'low_security_auditing',
      message: 'Low percentage of security-related audits. Enhance security monitoring.',
      priority: 'medium',
      action: 'Enable additional security audit logging for critical actions.',
    });
  }

  // Entity coverage recommendations
  if (stats.unique_entities < 5) {
    recommendations.push({
      type: 'limited_entity_coverage',
      message: `Limited entity coverage (${stats.unique_entities} entities). Consider expanding audit logging.`,
      priority: 'low',
      action: 'Review and expand audit logging to cover more system entities.',
    });
  }

  // User participation recommendations
  const activeUsers = Object.keys(stats.user_activity).length;
  const userParticipationRate = (activeUsers / stats.unique_users) * 100;
  
  if (userParticipationRate < 50) {
    recommendations.push({
      type: 'low_user_participation',
      message: `Low user participation in audit activities (${userParticipationRate.toFixed(1)}% of users).`,
      priority: 'medium',
      action: 'Review user activity and system usage patterns.',
    });
  }

  // Trend-based recommendations
  if (trends.growth_rates) {
    if (trends.growth_rates.daily_audit_growth < -20) {
      recommendations.push({
        type: 'declining_audit_activity',
        message: 'Audit activity shows significant decline. Investigate potential issues.',
        priority: 'high',
        action: 'Investigate reasons for declining audit activity.',
      });
    }
    
    if (trends.growth_rates.daily_audit_growth > 50) {
      recommendations.push({
        type: 'rapid_audit_growth',
        message: 'Audit activity shows rapid growth. Ensure system can handle increased load.',
        priority: 'medium',
        action: 'Monitor system performance and plan for scalability.',
      });
    }
  }

  // Data quality recommendations
  const auditsWithoutUser = Object.values(stats.user_activity)
    .filter(user => !user.user_id).length;
  
  if (auditsWithoutUser > stats.total_audits * 0.05) {
    recommendations.push({
      type: 'missing_user_data',
      message: `${auditsWithoutUser} audits missing user information. Improve data capture.`,
      priority: 'medium',
      action: 'Ensure all audits capture user information.',
    });
  }

  // Compliance recommendations
  if (stats.consistency_metrics.audit_coverage < 90) {
    recommendations.push({
      type: 'incomplete_audit_coverage',
      message: `Incomplete audit coverage (${stats.consistency_metrics.audit_coverage.toFixed(1)}% of days).`,
      priority: 'medium',
      action: 'Ensure consistent audit logging across all operational days.',
    });
  }

  return recommendations;
}

module.exports = getAuditStatistics;