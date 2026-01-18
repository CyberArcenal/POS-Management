// audit_trail/monitoring/suspicious.ipc.js
//@ts-check
const AuditTrail = require("../../../../entities/AuditTrail");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {Object} filters
 * @param {number} userId
 */
async function getSuspiciousActivities(filters = {}, userId) {
  try {
    const auditRepo = AppDataSource.getRepository(AuditTrail);

    // Get date range (default to last 7 days for suspicious activity monitoring)
    // @ts-ignore
    const endDate = filters.end_date ? new Date(filters.end_date) : new Date();
    // @ts-ignore
    const startDate = filters.start_date ? new Date(filters.start_date) : new Date();
    startDate.setDate(startDate.getDate() - 7);

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
    if (filters.user_id) {
      // @ts-ignore
      queryBuilder.andWhere("audit.user_id = :user_id", { user_id: filters.user_id });
    }

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

    const audits = await queryBuilder.getMany();

    if (audits.length === 0) {
      return {
        status: true,
        message: "No audit activities found for the specified period",
        data: {
          period: {
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            // @ts-ignore
            days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
          },
          suspicious_activities: [],
          risk_assessment: {
            overall_risk: 'low',
            categories: {},
          },
          alerts: [],
          recommendations: [],
        },
      };
    }

    // Define suspicious patterns
    const suspiciousPatterns = defineSuspiciousPatterns();

    // Analyze audits for suspicious activities
    const suspiciousActivities = analyzeForSuspiciousActivities(audits, suspiciousPatterns);

    // Calculate risk assessment
    const riskAssessment = calculateRiskAssessment(suspiciousActivities, audits.length);

    // Generate alerts
    const alerts = generateSuspiciousAlerts(suspiciousActivities, riskAssessment);

    // Generate recommendations
    const recommendations = generateSuspiciousRecommendations(suspiciousActivities, riskAssessment);

    // Parse details for suspicious activities
    const parsedSuspiciousActivities = suspiciousActivities.map(activity => {
      let parsedDetails = null;
      if (activity.audit.details) {
        try {
          parsedDetails = JSON.parse(activity.audit.details);
        } catch {
          parsedDetails = activity.audit.details;
        }
      }

      return {
        id: activity.audit.id,
        action: activity.audit.action,
        entity: activity.audit.entity,
        entity_id: activity.audit.entity_id,
        timestamp: activity.audit.timestamp,
        details: parsedDetails,
        suspicious_reasons: activity.reasons,
        risk_level: activity.risk_level,
        confidence: activity.confidence,
        user_info: activity.audit.user ? {
          id: activity.audit.user.id,
          username: activity.audit.user.username,
          role: activity.audit.user.role,
        } : null,
      };
    });

    await log_audit("suspicious_activities", "AuditTrail", 0, userId, {
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
      total_audits: audits.length,
      suspicious_count: suspiciousActivities.length,
      overall_risk: riskAssessment.overall_risk,
    });

    return {
      status: true,
      message: "Suspicious activities analysis completed",
      data: {
        report_period: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          // @ts-ignore
          days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
        },
        audit_summary: {
          total_audits: audits.length,
          suspicious_activities: suspiciousActivities.length,
          suspicious_percentage: (suspiciousActivities.length / audits.length) * 100,
        },
        suspicious_activities: parsedSuspiciousActivities,
        risk_assessment: riskAssessment,
        alerts: alerts,
        recommendations: recommendations,
        suspicious_patterns_detected: Object.keys(suspiciousPatterns).filter(
          pattern => suspiciousActivities.some(a => a.reasons.includes(pattern))
        ),
        filters_applied: filters,
      },
    };
  } catch (error) {
    console.error("getSuspiciousActivities error:", error);

    await log_audit("error", "AuditTrail", 0, userId, {
      action: "suspicious_activities",
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to analyze suspicious activities: ${error.message}`,
      data: null,
    };
  }
}

/**
 * Define suspicious patterns for detection
 */
function defineSuspiciousPatterns() {
  return {
    // High-risk actions
    high_risk_actions: ['delete', 'access_denied', 'config_change', 'permission_change', 'password_change'],
    
    // Unusual time patterns (off-hours: 10 PM to 6 AM)
    off_hours: { start: 22, end: 6 },
    
    // High frequency thresholds
    high_frequency_threshold: 100, // actions per hour
    burst_threshold: 50, // actions per 10 minutes
    
    // Unusual user behavior
    new_user_activity: 24, // hours since user creation
    inactive_user_sudden_activity: 30, // days of inactivity before sudden activity
    
    // Data access patterns
    excessive_data_access: 1000, // records accessed in single session
    unusual_entity_access: ['AuditTrail', 'User', 'SystemConfig'], // sensitive entities
    
    // Geographical anomalies (if IP data available)
    multiple_locations: 3, // different locations within short time
    
    // Sequential patterns
    rapid_sequence: 10, // same action within 1 minute
  };
}

/**
 * Analyze audits for suspicious activities
 * @param {{ id: unknown; action: unknown; entity: unknown; entity_id: unknown; details: unknown; timestamp: unknown; user_id: unknown; }[]} audits
 * @param {{ high_risk_actions: any; off_hours: any; high_frequency_threshold: any; burst_threshold: any; new_user_activity?: number; inactive_user_sudden_activity?: number; excessive_data_access?: number; unusual_entity_access: any; multiple_locations?: number; rapid_sequence: any; }} patterns
 */
function analyzeForSuspiciousActivities(audits, patterns) {
  /**
     * @type {{ audit: any; reasons: string[]; risk_level: string; confidence: number; timestamp: any; }[]}
     */
  const suspiciousActivities = [];

  // Group audits by user for user behavior analysis
  const userAudits = {};
  // @ts-ignore
  audits.forEach((/** @type {{ user_id: string | number; }} */ audit) => {
    if (!audit.user_id) return;
    
    // @ts-ignore
    if (!userAudits[audit.user_id]) {
      // @ts-ignore
      userAudits[audit.user_id] = [];
    }
    // @ts-ignore
    userAudits[audit.user_id].push(audit);
  });

  // Analyze each audit
  // @ts-ignore
  audits.forEach((/** @type {{ action: string; timestamp: string | number | Date; user_id: string | number; entity: any; }} */ audit) => {
    const reasons = [];
    let riskLevel = 'low';
    let confidence = 0;

    // Check for high-risk actions
    if (patterns.high_risk_actions.includes(audit.action)) {
      reasons.push('high_risk_action');
      riskLevel = elevateRisk(riskLevel, 'medium');
      confidence += 30;
    }

    // Check for off-hours activity
    const hour = new Date(audit.timestamp).getHours();
    if (hour >= patterns.off_hours.start || hour <= patterns.off_hours.end) {
      reasons.push('off_hours_activity');
      riskLevel = elevateRisk(riskLevel, 'medium');
      confidence += 20;
    }

    // Check user-specific patterns
    // @ts-ignore
    if (audit.user_id && userAudits[audit.user_id]) {
      // @ts-ignore
      const userActivities = userAudits[audit.user_id];
      
      // Check for high frequency
      const hourlyCount = userActivities.filter((/** @type {{ timestamp: string | number | Date; }} */ a) => 
        // @ts-ignore
        Math.abs(new Date(a.timestamp) - new Date(audit.timestamp)) < (60 * 60 * 1000)
      ).length;
      
      if (hourlyCount > patterns.high_frequency_threshold) {
        reasons.push('high_frequency_activity');
        riskLevel = elevateRisk(riskLevel, 'high');
        confidence += 40;
      }

      // Check for burst activity
      const tenMinuteCount = userActivities.filter((/** @type {{ timestamp: string | number | Date; }} */ a) => 
        // @ts-ignore
        Math.abs(new Date(a.timestamp) - new Date(audit.timestamp)) < (10 * 60 * 1000)
      ).length;
      
      if (tenMinuteCount > patterns.burst_threshold) {
        reasons.push('burst_activity');
        riskLevel = elevateRisk(riskLevel, 'high');
        confidence += 35;
      }

      // Check for rapid sequence of same action
      const oneMinuteCount = userActivities.filter((/** @type {{ action: any; timestamp: string | number | Date; }} */ a) => 
        a.action === audit.action && 
        // @ts-ignore
        Math.abs(new Date(a.timestamp) - new Date(audit.timestamp)) < (60 * 1000)
      ).length;
      
      if (oneMinuteCount > patterns.rapid_sequence) {
        reasons.push('rapid_sequence');
        riskLevel = elevateRisk(riskLevel, 'medium');
        confidence += 25;
      }
    }

    // Check for unusual entity access
    if (patterns.unusual_entity_access.includes(audit.entity)) {
      reasons.push('sensitive_entity_access');
      riskLevel = elevateRisk(riskLevel, 'medium');
      confidence += 25;
    }

    // Check for access denied patterns
    if (audit.action === 'access_denied') {
      // Multiple access denied for same user
      // @ts-ignore
      const userAccessDenied = audits.filter((/** @type {{ user_id: any; action: string; timestamp: string | number | Date; }} */ a) => 
        a.user_id === audit.user_id && 
        a.action === 'access_denied' &&
        // @ts-ignore
        Math.abs(new Date(a.timestamp) - new Date(audit.timestamp)) < (5 * 60 * 1000)
      ).length;
      
      if (userAccessDenied > 5) {
        reasons.push('multiple_access_denied');
        riskLevel = elevateRisk(riskLevel, 'high');
        confidence += 45;
      }
    }

    // If suspicious reasons found, add to results
    if (reasons.length > 0) {
      // Adjust confidence based on number of reasons
      confidence = Math.min(100, confidence + (reasons.length * 5));
      
      suspiciousActivities.push({
        audit,
        reasons,
        risk_level: riskLevel,
        confidence: confidence,
        timestamp: audit.timestamp,
      });
    }
  });

  // Additional pattern detection across all audits
  detectCrossAuditPatterns(audits, suspiciousActivities, patterns);

  // Sort by risk level and confidence
  return suspiciousActivities.sort((a, b) => {
    const riskOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    // @ts-ignore
    if (riskOrder[b.risk_level] !== riskOrder[a.risk_level]) {
      // @ts-ignore
      return riskOrder[b.risk_level] - riskOrder[a.risk_level];
    }
    return b.confidence - a.confidence;
  });
}

/**
 * Elevate risk level
 * @param {string} currentRisk
 * @param {string} newRisk
 */
function elevateRisk(currentRisk, newRisk) {
  const riskOrder = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
  // @ts-ignore
  return riskOrder[newRisk] > riskOrder[currentRisk] ? newRisk : currentRisk;
}

/**
 * Detect patterns across multiple audits
 * @param {any[]} audits
 * @param {any[]} suspiciousActivities
 * @param {{ high_frequency_threshold: number; }} patterns
 */
function detectCrossAuditPatterns(audits, suspiciousActivities, patterns) {
  // Group by user and hour for pattern detection
  const userHourlyActivity = {};
  audits.forEach((/** @type {{ user_id: any; timestamp: string | number | Date; }} */ audit) => {
    if (!audit.user_id) return;
    
    const hour = new Date(audit.timestamp).getHours();
    const key = `${audit.user_id}-${hour}`;
    
    // @ts-ignore
    if (!userHourlyActivity[key]) {
      // @ts-ignore
      userHourlyActivity[key] = {
        user_id: audit.user_id,
        hour: hour,
        audits: [],
      };
    }
    // @ts-ignore
    userHourlyActivity[key].audits.push(audit);
  });

  // Detect unusual hourly patterns
  Object.values(userHourlyActivity).forEach(data => {
    if (data.audits.length > patterns.high_frequency_threshold) {
      // Mark all audits in this hour as suspicious
      data.audits.forEach((/** @type {{ id: any; timestamp: any; }} */ audit) => {
        const existing = suspiciousActivities.find((/** @type {{ audit: { id: any; }; }} */ sa) => sa.audit.id === audit.id);
        if (existing) {
          if (!existing.reasons.includes('unusual_hourly_volume')) {
            existing.reasons.push('unusual_hourly_volume');
            existing.risk_level = elevateRisk(existing.risk_level, 'high');
            existing.confidence += 30;
          }
        } else {
          suspiciousActivities.push({
            audit,
            reasons: ['unusual_hourly_volume'],
            risk_level: 'high',
            confidence: 60,
            timestamp: audit.timestamp,
          });
        }
      });
    }
  });

  // Detect cross-user patterns (same action from multiple users in short time)
  const actionTimeGroups = {};
  audits.forEach((/** @type {{ action: any; timestamp: string | number | Date; user_id: any; }} */ audit) => {
    const timeKey = `${audit.action}-${Math.floor(new Date(audit.timestamp).getTime() / (5 * 60 * 1000))}`;
    
    // @ts-ignore
    if (!actionTimeGroups[timeKey]) {
      // @ts-ignore
      actionTimeGroups[timeKey] = {
        action: audit.action,
        timestamp: audit.timestamp,
        users: new Set(),
        audits: [],
      };
    }
    // @ts-ignore
    actionTimeGroups[timeKey].users.add(audit.user_id);
    // @ts-ignore
    actionTimeGroups[timeKey].audits.push(audit);
  });

  Object.values(actionTimeGroups).forEach(group => {
    if (group.users.size > 3) {
      // Multiple users performing same action within 5 minutes
      group.audits.forEach((/** @type {{ id: any; timestamp: any; }} */ audit) => {
        const existing = suspiciousActivities.find((/** @type {{ audit: { id: any; }; }} */ sa) => sa.audit.id === audit.id);
        if (existing) {
          if (!existing.reasons.includes('coordinated_activity')) {
            existing.reasons.push('coordinated_activity');
            existing.risk_level = elevateRisk(existing.risk_level, 'critical');
            existing.confidence += 50;
          }
        } else {
          suspiciousActivities.push({
            audit,
            reasons: ['coordinated_activity'],
            risk_level: 'critical',
            confidence: 80,
            timestamp: audit.timestamp,
          });
        }
      });
    }
  });
}

/**
 * Calculate risk assessment
 * @param {any[]} suspiciousActivities
 * @param {number} totalAudits
 */
function calculateRiskAssessment(suspiciousActivities, totalAudits) {
  const riskAssessment = {
    overall_risk: 'low',
    categories: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    },
    metrics: {
      suspicious_count: suspiciousActivities.length,
      suspicious_percentage: (suspiciousActivities.length / totalAudits) * 100,
      average_confidence: 0,
      highest_risk_reasons: [],
    },
  };

  // Count by risk level
  suspiciousActivities.forEach((/** @type {{ risk_level: string | number; }} */ activity) => {
    // @ts-ignore
    riskAssessment.categories[activity.risk_level]++;
  });

  // Calculate average confidence
  if (suspiciousActivities.length > 0) {
    riskAssessment.metrics.average_confidence = 
      suspiciousActivities.reduce((/** @type {any} */ sum, /** @type {{ confidence: any; }} */ a) => sum + a.confidence, 0) / suspiciousActivities.length;
  }

  // Determine overall risk
  if (riskAssessment.categories.critical > 0) {
    riskAssessment.overall_risk = 'critical';
  } else if (riskAssessment.categories.high > 0) {
    riskAssessment.overall_risk = 'high';
  } else if (riskAssessment.categories.medium > 3) {
    riskAssessment.overall_risk = 'medium';
  } else if (riskAssessment.categories.medium > 0 || riskAssessment.categories.low > 5) {
    riskAssessment.overall_risk = 'low';
  }

  // Find most common reasons
  const reasonCounts = {};
  suspiciousActivities.forEach((/** @type {{ reasons: any[]; }} */ activity) => {
    activity.reasons.forEach((/** @type {string | number} */ reason) => {
      // @ts-ignore
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });
  });

  // @ts-ignore
  riskAssessment.metrics.highest_risk_reasons = Object.entries(reasonCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([reason, count]) => ({ reason, count }));

  return riskAssessment;
}

/**
 * Generate suspicious alerts
 * @param {any[]} suspiciousActivities
 * @param {{ overall_risk: any; categories?: { critical: number; high: number; medium: number; low: number; }; metrics: any; }} riskAssessment
 */
function generateSuspiciousAlerts(suspiciousActivities, riskAssessment) {
  const alerts = [];

  // Critical risk alerts
  const criticalActivities = suspiciousActivities.filter((/** @type {{ risk_level: string; }} */ a) => a.risk_level === 'critical');
  if (criticalActivities.length > 0) {
    alerts.push({
      type: 'critical_risk',
      level: 'critical',
      message: `${criticalActivities.length} critical risk activities detected`,
      description: 'Immediate investigation required for potential security breaches',
      actions: ['Investigate immediately', 'Notify security team', 'Consider system lockdown'],
      activities: criticalActivities.slice(0, 3).map((/** @type {{ audit: { id: any; action: any; user: { username: any; }; timestamp: any; }; reasons: any; }} */ a) => ({
        id: a.audit.id,
        action: a.audit.action,
        user: a.audit.user?.username || 'Unknown',
        timestamp: a.audit.timestamp,
        reasons: a.reasons,
      })),
    });
  }

  // High risk alerts
  const highActivities = suspiciousActivities.filter((/** @type {{ risk_level: string; }} */ a) => a.risk_level === 'high');
  if (highActivities.length > 0) {
    alerts.push({
      type: 'high_risk',
      level: 'high',
      message: `${highActivities.length} high risk activities detected`,
      description: 'Urgent investigation recommended for suspicious activities',
      actions: ['Review within 24 hours', 'Monitor user activity', 'Check system logs'],
      activities: highActivities.slice(0, 5).map((/** @type {{ audit: { id: any; action: any; user: { username: any; }; timestamp: any; }; reasons: any; }} */ a) => ({
        id: a.audit.id,
        action: a.audit.action,
        user: a.audit.user?.username || 'Unknown',
        timestamp: a.audit.timestamp,
        reasons: a.reasons,
      })),
    });
  }

  // Pattern-based alerts
  const burstActivities = suspiciousActivities.filter((/** @type {{ reasons: string | string[]; }} */ a) => a.reasons.includes('burst_activity'));
  if (burstActivities.length > 0) {
    const users = [...new Set(burstActivities.map((/** @type {{ audit: { user: { username: any; }; }; }} */ a) => a.audit.user?.username || 'Unknown'))];
    alerts.push({
      type: 'burst_activity',
      level: 'medium',
      message: `Burst activity detected from ${users.length} user(s)`,
      description: 'Unusually high volume of activities in short time periods',
      actions: ['Review user activity patterns', 'Check for automated scripts', 'Verify business needs'],
      user_count: users.length,
    });
  }

  const offHoursActivities = suspiciousActivities.filter((/** @type {{ reasons: string | string[]; }} */ a) => a.reasons.includes('off_hours_activity'));
  if (offHoursActivities.length > 0) {
    alerts.push({
      type: 'off_hours_activity',
      level: 'medium',
      message: `${offHoursActivities.length} off-hours activities detected`,
      description: 'Activities occurring during non-business hours',
      actions: ['Verify business requirements', 'Check remote access logs', 'Review access permissions'],
      time_period: '10 PM - 6 AM',
    });
  }

  const accessDeniedActivities = suspiciousActivities.filter((/** @type {{ reasons: string | string[]; }} */ a) => a.reasons.includes('multiple_access_denied'));
  if (accessDeniedActivities.length > 0) {
    alerts.push({
      type: 'multiple_access_denied',
      level: 'high',
      message: 'Multiple access denied attempts detected',
      description: 'Potential brute force or unauthorized access attempts',
      actions: ['Review security logs', 'Check for intrusion attempts', 'Consider account lockdown'],
      attempt_count: accessDeniedActivities.length,
    });
  }

  // Overall risk alert
  if (riskAssessment.overall_risk === 'critical' || riskAssessment.overall_risk === 'high') {
    alerts.push({
      type: 'overall_risk',
      level: riskAssessment.overall_risk,
      message: `Overall risk level: ${riskAssessment.overall_risk.toUpperCase()}`,
      description: 'System security may be compromised. Immediate action required.',
      actions: ['Full security audit', 'System-wide monitoring', 'Incident response activation'],
      metrics: {
        suspicious_count: riskAssessment.metrics.suspicious_count,
        suspicious_percentage: riskAssessment.metrics.suspicious_percentage,
      },
    });
  }

  return alerts;
}

/**
 * Generate suspicious recommendations
 * @param {any[]} suspiciousActivities
 * @param {{ overall_risk: any; categories: any; metrics: any; }} riskAssessment
 */
function generateSuspiciousRecommendations(suspiciousActivities, riskAssessment) {
  const recommendations = [];

  // High suspicion rate recommendation
  if (riskAssessment.metrics.suspicious_percentage > 10) {
    recommendations.push({
      type: 'high_suspicion_rate',
      priority: 'high',
      message: `High suspicion rate: ${riskAssessment.metrics.suspicious_percentage.toFixed(1)}% of activities flagged`,
      action: 'Review audit logging configuration and suspicious pattern thresholds.',
    });
  }

  // Critical risk recommendation
  if (riskAssessment.categories.critical > 0) {
    recommendations.push({
      type: 'critical_risks_detected',
      priority: 'critical',
      message: `${riskAssessment.categories.critical} critical risk activities detected`,
      action: 'Immediate investigation and incident response activation required.',
    });
  }

  // User-specific recommendations
  const userRiskCounts = {};
  suspiciousActivities.forEach((/** @type {{ audit: { user_id: any; user: { username: any; }; }; risk_level: string; }} */ activity) => {
    if (activity.audit.user_id) {
      const userId = activity.audit.user_id;
      // @ts-ignore
      userRiskCounts[userId] = userRiskCounts[userId] || { 
        user_id: userId, 
        username: activity.audit.user?.username || 'Unknown',
        critical: 0, 
        high: 0, 
        medium: 0, 
        low: 0 
      };
      
      // @ts-ignore
      if (activity.risk_level === 'critical') userRiskCounts[userId].critical++;
      // @ts-ignore
      else if (activity.risk_level === 'high') userRiskCounts[userId].high++;
      // @ts-ignore
      else if (activity.risk_level === 'medium') userRiskCounts[userId].medium++;
      // @ts-ignore
      else userRiskCounts[userId].low++;
    }
  });

  const highRiskUsers = Object.values(userRiskCounts).filter(user => 
    user.critical > 0 || user.high > 3
  );

  if (highRiskUsers.length > 0) {
    recommendations.push({
      type: 'high_risk_users',
      priority: 'high',
      message: `${highRiskUsers.length} users with high risk activities detected`,
      action: 'Review user permissions, activity patterns, and consider temporary restrictions.',
      users: highRiskUsers.map(user => ({
        user_id: user.user_id,
        username: user.username,
        critical_risks: user.critical,
        high_risks: user.high,
      })),
    });
  }

  // Pattern-based recommendations
  const commonReasons = riskAssessment.metrics.highest_risk_reasons.slice(0, 3);
  // @ts-ignore
  commonReasons.forEach(({ reason, count }) => {
    let action = '';
    switch (reason) {
      case 'high_frequency_activity':
        action = 'Review activity frequency thresholds and implement rate limiting.';
        break;
      case 'off_hours_activity':
        action = 'Implement time-based access controls and monitor off-hours activity.';
        break;
      case 'sensitive_entity_access':
        action = 'Review access controls for sensitive entities and implement additional logging.';
        break;
      case 'multiple_access_denied':
        action = 'Implement account lockout policies and monitor failed access attempts.';
        break;
      case 'burst_activity':
        action = 'Investigate for automated scripts and implement anti-automation measures.';
        break;
      default:
        action = 'Review suspicious pattern detection rules.';
    }

    recommendations.push({
      type: `common_pattern_${reason}`,
      priority: 'medium',
      message: `${count} activities flagged for ${reason.replace(/_/g, ' ')}`,
      action: action,
    });
  });

  // System-wide recommendations
  if (riskAssessment.overall_risk === 'critical' || riskAssessment.overall_risk === 'high') {
    recommendations.push({
      type: 'system_wide_security_review',
      priority: 'critical',
      message: 'System-wide security review required',
      action: 'Conduct comprehensive security audit, review all access logs, and update security policies.',
    });
  }

  // Monitoring recommendations
  recommendations.push({
    type: 'enhanced_monitoring',
    priority: 'medium',
    message: 'Consider enhanced monitoring for detected patterns',
    action: 'Implement real-time alerting for suspicious patterns and increase audit logging granularity.',
  });

  // Training recommendations
  if (riskAssessment.metrics.suspicious_percentage > 5) {
    recommendations.push({
      type: 'user_training',
      priority: 'low',
      message: 'Consider user security training',
      action: 'Provide security awareness training to users to reduce accidental suspicious activities.',
    });
  }

  return recommendations;
}

module.exports = getSuspiciousActivities;