// audit_trail/reports/activity.ipc.js
//@ts-check
const AuditTrail = require("../../../../entities/AuditTrail");
const User = require("../../../../entities/User");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {Object} filters
 * @param {number} userId
 */
async function getAuditActivityReport(filters = {}, userId) {
  try {
    const auditRepo = AppDataSource.getRepository(AuditTrail);
    const userRepo = AppDataSource.getRepository(User);

    // Get date range (default to last 30 days)
    // @ts-ignore
    const endDate = filters.end_date ? new Date(filters.end_date) : new Date();
    // @ts-ignore
    const startDate = filters.start_date ? new Date(filters.start_date) : new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Build query for audits
    const queryBuilder = auditRepo
      .createQueryBuilder("audit")
      .leftJoinAndSelect("audit.user", "user")
      .where("audit.timestamp BETWEEN :start_date AND :end_date", {
        start_date: startDate,
        end_date: endDate,
      })
      .orderBy("audit.timestamp", "DESC");

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

    // Get all users for comparison
    const allUsers = await userRepo.find({
      where: { is_active: true },
      select: ["id", "username", "display_name", "role", "last_login_at"],
    });

    if (audits.length === 0) {
      return {
        status: true,
        message: "No audit activity found for the specified period",
        data: {
          period: {
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            // @ts-ignore
            days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
          },
          summary: {
            total_audits: 0,
            active_users: 0,
            total_users: allUsers.length,
            activity_rate: 0,
          },
          user_activity: [],
          daily_activity: [],
          entity_activity: [],
          recommendations: [],
        },
      };
    }

    // Calculate activity summary
    const summary = {
      total_audits: audits.length,
      active_users: new Set(audits.map(a => a.user_id)).size,
      total_users: allUsers.length,
      // @ts-ignore
      period_days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
    };

    // @ts-ignore
    summary.activity_rate = (summary.active_users / summary.total_users) * 100;
    // @ts-ignore
    summary.audits_per_active_user = summary.total_audits / summary.active_users;
    // @ts-ignore
    summary.audits_per_day = summary.total_audits / summary.period_days;

    // Group by user for detailed activity analysis
    const userActivity = {};
    
    // Initialize all users
    allUsers.forEach(user => {
      // @ts-ignore
      userActivity[user.id] = {
        user_id: user.id,
        username: user.username,
        display_name: user.display_name,
        role: user.role,
        last_login: user.last_login_at,
        audits: 0,
        entities: new Set(),
        actions: new Set(),
        days_active: new Set(),
        first_audit: null,
        last_audit: null,
        audit_timeline: [],
      };
    });

    // Add audit data to users
    audits.forEach(audit => {
      if (!audit.user_id) return;
      
      // @ts-ignore
      const userStats = userActivity[audit.user_id];
      if (!userStats) return;
      
      userStats.audits++;
      userStats.entities.add(audit.entity);
      userStats.actions.add(audit.action);
      
      // @ts-ignore
      const date = audit.timestamp.toISOString().split('T')[0];
      userStats.days_active.add(date);
      
      // @ts-ignore
      if (!userStats.first_audit || audit.timestamp < userStats.first_audit) {
        userStats.first_audit = audit.timestamp;
      }
      // @ts-ignore
      if (!userStats.last_audit || audit.timestamp > userStats.last_audit) {
        userStats.last_audit = audit.timestamp;
      }
      
      userStats.audit_timeline.push({
        id: audit.id,
        action: audit.action,
        entity: audit.entity,
        timestamp: audit.timestamp,
        details: audit.details ? (() => {
          // @ts-ignore
          try { return JSON.parse(audit.details); } catch { return audit.details; }
        })() : null,
      });
    });

    // Convert Sets to counts and calculate metrics
    Object.keys(userActivity).forEach(userId => {
      // @ts-ignore
      const userStats = userActivity[userId];
      userStats.unique_entities = userStats.entities.size;
      userStats.unique_actions = userStats.actions.size;
      userStats.days_active_count = userStats.days_active.size;
      userStats.activity_level = calculateActivityLevel(userStats);
      userStats.audits_per_active_day = userStats.days_active_count > 0 ? 
        userStats.audits / userStats.days_active_count : 0;
      userStats.entity_diversity = userStats.unique_entities / Math.max(1, userStats.audits);
      userStats.action_diversity = userStats.unique_actions / Math.max(1, userStats.audits);
      
      // Sort timeline
      // @ts-ignore
      userStats.audit_timeline.sort((/** @type {{ timestamp: string | number | Date; }} */ a, /** @type {{ timestamp: string | number | Date; }} */ b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      delete userStats.entities;
      delete userStats.actions;
      delete userStats.days_active;
    });

    // Convert to array and categorize users
    const userActivityArray = Object.values(userActivity)
      .filter(user => user.audits > 0)
      .map(user => ({
        ...user,
        category: categorizeUserActivity(user),
        recent_activity: user.audit_timeline.slice(0, 5),
      }));

    // Group by activity category
    const activityCategories = {
      highly_active: [],
      moderately_active: [],
      lightly_active: [],
      inactive: [],
    };

    userActivityArray.forEach(user => {
      // @ts-ignore
      activityCategories[user.category].push({
        user_id: user.user_id,
        username: user.username,
        audits: user.audits,
        days_active: user.days_active_count,
      });
    });

    // Calculate category statistics
    const categoryStats = {};
    Object.keys(activityCategories).forEach(category => {
      // @ts-ignore
      const users = activityCategories[category];
      // @ts-ignore
      categoryStats[category] = {
        user_count: users.length,
        total_audits: users.reduce((/** @type {any} */ sum, /** @type {{ audits: any; }} */ user) => sum + user.audits, 0),
        percentage_of_users: (users.length / userActivityArray.length) * 100,
        percentage_of_audits: users.reduce((/** @type {any} */ sum, /** @type {{ audits: any; }} */ user) => sum + user.audits, 0) / summary.total_audits * 100,
      };
    });

    // Group by day for daily activity trend
    const dailyActivity = {};
    audits.forEach(audit => {
      // @ts-ignore
      const date = audit.timestamp.toISOString().split('T')[0];
      // @ts-ignore
      if (!dailyActivity[date]) {
        // @ts-ignore
        dailyActivity[date] = {
          date,
          audits: 0,
          users: new Set(),
          entities: new Set(),
          actions: new Set(),
        };
      }
      
      // @ts-ignore
      dailyActivity[date].audits++;
      // @ts-ignore
      dailyActivity[date].users.add(audit.user_id);
      // @ts-ignore
      dailyActivity[date].entities.add(audit.entity);
      // @ts-ignore
      dailyActivity[date].actions.add(audit.action);
    });

    // Convert Sets to counts
    Object.keys(dailyActivity).forEach(date => {
      // @ts-ignore
      dailyActivity[date].unique_users = dailyActivity[date].users.size;
      // @ts-ignore
      dailyActivity[date].unique_entities = dailyActivity[date].entities.size;
      // @ts-ignore
      dailyActivity[date].unique_actions = dailyActivity[date].actions.size;
      // @ts-ignore
      delete dailyActivity[date].users;
      // @ts-ignore
      delete dailyActivity[date].entities;
      // @ts-ignore
      delete dailyActivity[date].actions;
    });

    const dailyActivityArray = Object.values(dailyActivity)
      // @ts-ignore
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Group by entity for entity activity analysis
    const entityActivity = {};
    audits.forEach(audit => {
      // @ts-ignore
      if (!entityActivity[audit.entity]) {
        // @ts-ignore
        entityActivity[audit.entity] = {
          entity: audit.entity,
          audits: 0,
          users: new Set(),
          actions: new Set(),
          first_audit: audit.timestamp,
          last_audit: audit.timestamp,
        };
      }
      
      // @ts-ignore
      entityActivity[audit.entity].audits++;
      // @ts-ignore
      entityActivity[audit.entity].users.add(audit.user_id);
      // @ts-ignore
      entityActivity[audit.entity].actions.add(audit.action);
      
      // @ts-ignore
      if (audit.timestamp < entityActivity[audit.entity].first_audit) {
        // @ts-ignore
        entityActivity[audit.entity].first_audit = audit.timestamp;
      }
      // @ts-ignore
      if (audit.timestamp > entityActivity[audit.entity].last_audit) {
        // @ts-ignore
        entityActivity[audit.entity].last_audit = audit.timestamp;
      }
    });

    // Convert Sets to counts
    Object.keys(entityActivity).forEach(entity => {
      // @ts-ignore
      entityActivity[entity].unique_users = entityActivity[entity].users.size;
      // @ts-ignore
      entityActivity[entity].unique_actions = entityActivity[entity].actions.size;
      // @ts-ignore
      entityActivity[entity].user_participation = (entityActivity[entity].unique_users / summary.active_users) * 100;
      // @ts-ignore
      delete entityActivity[entity].users;
      // @ts-ignore
      delete entityActivity[entity].actions;
    });

    const entityActivityArray = Object.values(entityActivity)
      .sort((a, b) => b.audits - a.audits);

    // Generate activity insights
    const insights = generateActivityInsights(summary, userActivityArray, dailyActivityArray, entityActivityArray);

    // Generate recommendations
    const recommendations = generateActivityRecommendations(summary, activityCategories, userActivityArray);

    await log_audit("activity_report", "AuditTrail", 0, userId, {
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
      total_audits: summary.total_audits,
      active_users: summary.active_users,
    });

    return {
      status: true,
      message: "Audit activity report generated successfully",
      data: {
        report_period: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          days: summary.period_days,
        },
        summary,
        user_activity: userActivityArray,
        activity_categories: activityCategories,
        category_statistics: categoryStats,
        daily_activity: dailyActivityArray,
        entity_activity: entityActivityArray,
        insights,
        recommendations,
        filters_applied: filters,
      },
    };
  } catch (error) {
    console.error("getAuditActivityReport error:", error);

    await log_audit("error", "AuditTrail", 0, userId, {
      action: "activity_report",
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to generate audit activity report: ${error.message}`,
      data: null,
    };
  }
}

/**
 * Calculate user activity level
 * @param {{ audits: number; first_audit: string | number | Date; days_active_count: number; }} userStats
 */
function calculateActivityLevel(userStats) {
  if (userStats.audits === 0) return 0;
  
  const daysSinceFirstAudit = userStats.first_audit ? 
    // @ts-ignore
    (new Date() - new Date(userStats.first_audit)) / (1000 * 60 * 60 * 24) : 0;
  
  if (daysSinceFirstAudit === 0) return 0;
  
  const auditsPerDay = userStats.audits / daysSinceFirstAudit;
  const daysActiveRate = userStats.days_active_count / Math.min(daysSinceFirstAudit, 30);
  
  // Weighted score: 60% audits per day, 40% days active rate
  const score = (auditsPerDay * 0.6) + (daysActiveRate * 0.4);
  
  if (score > 5) return 5; // Highly active
  if (score > 2) return 4; // Very active
  if (score > 1) return 3; // Moderately active
  if (score > 0.5) return 2; // Lightly active
  if (score > 0) return 1; // Minimally active
  return 0; // Inactive
}

/**
 * Categorize user activity
 * @param {{ audits: number; activity_level: number; }} user
 */
function categorizeUserActivity(user) {
  if (user.audits === 0) return 'inactive';
  if (user.activity_level >= 4) return 'highly_active';
  if (user.activity_level >= 2) return 'moderately_active';
  return 'lightly_active';
}

/**
 * Generate activity insights
 * @param {{ total_audits: any; active_users: any; total_users: any; period_days: any; activity_rate?: any; audits_per_active_user?: any; }} summary
 * @param {any[]} userActivity
 * @param {any[]} dailyActivity
 * @param {string | any[]} entityActivity
 */
function generateActivityInsights(summary, userActivity, dailyActivity, entityActivity) {
  const insights = [];

  // Overall activity insight
  if (summary.activity_rate < 30) {
    insights.push({
      type: 'low_participation',
      message: `Low user participation: Only ${summary.activity_rate.toFixed(1)}% of users have audit activity`,
      priority: 'medium',
      data: { activity_rate: summary.activity_rate },
    });
  }

  if (summary.activity_rate > 80) {
    insights.push({
      type: 'high_participation',
      message: `High user participation: ${summary.activity_rate.toFixed(1)}% of users have audit activity`,
      priority: 'low',
      data: { activity_rate: summary.activity_rate },
    });
  }

  // Daily activity consistency insight
  const daysWithActivity = dailyActivity.filter((/** @type {{ audits: number; }} */ day) => day.audits > 0).length;
  const activityConsistency = (daysWithActivity / summary.period_days) * 100;
  
  if (activityConsistency < 50) {
    insights.push({
      type: 'inconsistent_activity',
      message: `Activity on only ${activityConsistency.toFixed(1)}% of days (${daysWithActivity}/${summary.period_days} days)`,
      priority: 'medium',
      data: { consistency_percentage: activityConsistency, active_days: daysWithActivity },
    });
  }

  // Top user insight
  if (userActivity.length > 0) {
    const topUser = userActivity.reduce((/** @type {{ audits: number; }} */ max, /** @type {{ audits: number; }} */ user) => user.audits > max.audits ? user : max);
    const topUserPercentage = (topUser.audits / summary.total_audits) * 100;
    
    if (topUserPercentage > 30) {
      insights.push({
        type: 'dominant_user',
        message: `${topUser.username} accounts for ${topUserPercentage.toFixed(1)}% of all audit activity`,
        priority: 'medium',
        data: {
          username: topUser.username,
          percentage: topUserPercentage,
          audits: topUser.audits,
        },
      });
    }
  }

  // Entity concentration insight
  if (entityActivity.length > 0) {
    const topEntity = entityActivity[0];
    const topEntityPercentage = (topEntity.audits / summary.total_audits) * 100;
    
    if (topEntityPercentage > 40) {
      insights.push({
        type: 'entity_concentration',
        message: `${topEntity.entity} accounts for ${topEntityPercentage.toFixed(1)}% of all audit activity`,
        priority: 'medium',
        data: {
          entity: topEntity.entity,
          percentage: topEntityPercentage,
          audits: topEntity.audits,
        },
      });
    }
  }

  // User diversity insight
  const userDiversity = summary.active_users / summary.total_users * 100;
  if (userDiversity > 90) {
    insights.push({
      type: 'high_user_diversity',
      message: `High user diversity: ${summary.active_users} different users performed audits`,
      priority: 'low',
      data: { unique_users: summary.active_users, diversity_percentage: userDiversity },
    });
  }

  // Recent activity trend
  if (dailyActivity.length >= 7) {
    const recentWeek = dailyActivity.slice(-7);
    const weekAudits = recentWeek.reduce((/** @type {any} */ sum, /** @type {{ audits: any; }} */ day) => sum + day.audits, 0);
    const previousWeek = dailyActivity.slice(-14, -7);
    const previousWeekAudits = previousWeek.reduce((/** @type {any} */ sum, /** @type {{ audits: any; }} */ day) => sum + day.audits, 0);
    
    if (previousWeekAudits > 0) {
      const growth = ((weekAudits - previousWeekAudits) / previousWeekAudits) * 100;
      if (growth > 30) {
        insights.push({
          type: 'increasing_activity',
          message: `Audit activity increased by ${growth.toFixed(1)}% compared to previous week`,
          priority: 'medium',
          data: { growth_percentage: growth },
        });
      } else if (growth < -30) {
        insights.push({
          type: 'decreasing_activity',
          message: `Audit activity decreased by ${Math.abs(growth).toFixed(1)}% compared to previous week`,
          priority: 'medium',
          data: { decline_percentage: Math.abs(growth) },
        });
      }
    }
  }

  // Role-based insights (if role data available)
  const roleActivity = {};
  userActivity.forEach((/** @type {{ role: string | number; audits: any; }} */ user) => {
    if (user.role) {
      // @ts-ignore
      if (!roleActivity[user.role]) {
        // @ts-ignore
        roleActivity[user.role] = {
          role: user.role,
          users: 0,
          audits: 0,
        };
      }
      // @ts-ignore
      roleActivity[user.role].users++;
      // @ts-ignore
      roleActivity[user.role].audits += user.audits;
    }
  });

  Object.keys(roleActivity).forEach(role => {
    // @ts-ignore
    const roleStats = roleActivity[role];
    const avgAuditsPerUser = roleStats.audits / roleStats.users;
    if (avgAuditsPerUser > summary.audits_per_active_user * 2) {
      insights.push({
        type: 'high_role_activity',
        message: `${role} users average ${avgAuditsPerUser.toFixed(1)} audits per user (${(avgAuditsPerUser/summary.audits_per_active_user*100).toFixed(1)}% above average)`,
        priority: 'low',
        data: { role: role, average_audits: avgAuditsPerUser },
      });
    }
  });

  return insights;
}

/**
 * Generate activity recommendations
 * @param {{ total_audits: any; active_users: any; total_users: any; period_days?: number; audits_per_active_user?: any; }} summary
 * @param {{ highly_active: any; moderately_active?: never[]; lightly_active: any; inactive: any; }} activityCategories
 * @param {any[]} userActivity
 */
function generateActivityRecommendations(summary, activityCategories, userActivity) {
  const recommendations = [];

  // Inactive users recommendation
  if (activityCategories.inactive.length > summary.total_users * 0.3) {
    recommendations.push({
      type: 'many_inactive_users',
      message: `${activityCategories.inactive.length} users (${(activityCategories.inactive.length/summary.total_users*100).toFixed(1)}%) are inactive`,
      priority: 'medium',
      action: 'Review user training and system engagement for inactive users.',
    });
  }

  // Overly active users recommendation
  const highlyActiveUsers = activityCategories.highly_active;
  if (highlyActiveUsers.length > 0) {
    const topUser = highlyActiveUsers.reduce((/** @type {{ audits: number; }} */ max, /** @type {{ audits: number; }} */ user) => user.audits > max.audits ? user : max, { audits: 0 });
    if (topUser.audits > summary.audits_per_active_user * 5) {
      recommendations.push({
        type: 'overly_active_user',
        message: `${topUser.username} has ${topUser.audits} audits (${(topUser.audits/summary.total_audits*100).toFixed(1)}% of total)`,
        priority: 'low',
        action: 'Consider distributing responsibilities if appropriate.',
      });
    }
  }

  // Low diversity recommendation
  if (summary.active_users < 3) {
    recommendations.push({
      type: 'low_activity_diversity',
      message: `Only ${summary.active_users} users generating audit activity`,
      priority: 'high',
      action: 'Train more users and distribute system responsibilities.',
    });
  }

  // Entity concentration recommendation
  const entityConcentration = userActivity.reduce((/** @type {{ username: any; entity_diversity: any; }[]} */ acc, /** @type {{ entity_diversity: number; username: any; }} */ user) => {
    if (user.entity_diversity < 0.3) {
      acc.push({
        username: user.username,
        entity_diversity: user.entity_diversity,
      });
    }
    return acc;
  }, []);

  if (entityConcentration.length > userActivity.length * 0.5) {
    recommendations.push({
      type: 'low_entity_diversity',
      message: `${entityConcentration.length} users work with limited entity types`,
      priority: 'medium',
      action: 'Cross-train users on different system modules and entities.',
    });
  }

  // Action diversity recommendation
  const actionConcentration = userActivity.filter((/** @type {{ action_diversity: number; }} */ user) => user.action_diversity < 0.4);
  if (actionConcentration.length > 0) {
    recommendations.push({
      type: 'low_action_diversity',
      message: `${actionConcentration.length} users perform limited types of actions`,
      priority: 'low',
      action: 'Encourage users to explore different system functionalities.',
    });
  }

  // Recent inactivity recommendation
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const recentlyInactive = userActivity.filter((/** @type {{ last_audit: string | number | Date; }} */ user) => 
    user.last_audit && new Date(user.last_audit) < oneWeekAgo
  );
  
  if (recentlyInactive.length > 0) {
    recommendations.push({
      type: 'recent_inactivity',
      message: `${recentlyInactive.length} users have been inactive for over a week`,
      priority: 'low',
      action: 'Check in with recently inactive users about system usage.',
    });
  }

  // Training recommendation for lightly active users
  if (activityCategories.lightly_active.length > userActivity.length * 0.4) {
    recommendations.push({
      type: 'many_lightly_active_users',
      message: `${activityCategories.lightly_active.length} users (${(activityCategories.lightly_active.length/userActivity.length*100).toFixed(1)}%) are lightly active`,
      priority: 'medium',
      action: 'Provide additional training to lightly active users to increase system engagement.',
    });
  }

  return recommendations;
}

module.exports = getAuditActivityReport;