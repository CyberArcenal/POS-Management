// userActivity.ipc.js - User Activity Handler (Read-Only)
//@ts-check
const { ipcMain } = require("electron");

const { AppDataSource } = require("../db/dataSource");
const { logger } = require("../../utils/logger");
const { withErrorHandling } = require("../../utils/errorHandler");

class UserActivityHandler {
  constructor() {
    // Initialize repositories
    this.userActivityRepo = null;
    this.userRepo = null;
  }

  async initializeRepositories() {
    if (!this.userActivityRepo) {
      this.userActivityRepo = AppDataSource.getRepository("UserActivity");
    }
    if (!this.userRepo) {
      this.userRepo = AppDataSource.getRepository("User");
    }
  }

  /** @param {Electron.IpcMainInvokeEvent} event @param {{ method: any; params: {}; }} payload */
  async handleRequest(event, payload) {
    try {
      await this.initializeRepositories();
      
      const method = payload.method;
      const params = payload.params || {};
      // @ts-ignore
      const userId = params.userId || event.sender.id || 0;
      const enrichedParams = { ...params, _userId: userId };

      // Log the request
      if (logger) {
        // @ts-ignore
        logger.info(`UserActivityHandler: ${method}`, { 
          method, 
          userId,
          params: Object.keys(params).filter(key => key !== 'password' && key !== 'token')
        });
      }

      // ROUTE REQUESTS
      switch (method) {
        // 👤 USER ACTIVITY OPERATIONS
        case "getUserActivities":
          return await this.getUserActivities(
            // @ts-ignore
            enrichedParams.filters,
            // @ts-ignore
            enrichedParams.page,
            // @ts-ignore
            enrichedParams.limit,
            userId
          );

        case "getActivitiesByUser":
          return await this.getActivitiesByUser(
            // @ts-ignore
            enrichedParams.targetUserId,
            // @ts-ignore
            enrichedParams.limit,
            userId
          );

        case "getActivitiesByAction":
          return await this.getActivitiesByAction(
            // @ts-ignore
            enrichedParams.action,
            // @ts-ignore
            enrichedParams.limit,
            userId
          );

        case "getActivitiesByEntity":
          return await this.getActivitiesByEntity(
            // @ts-ignore
            enrichedParams.entity,
            // @ts-ignore
            enrichedParams.entityId,
            // @ts-ignore
            enrichedParams.limit,
            userId
          );

        case "getRecentActivities":
          return await this.getRecentActivities(
            // @ts-ignore
            enrichedParams.limit,
            userId
          );

        case "getActivityStats":
          return await this.getActivityStats(
            // @ts-ignore
            enrichedParams.dateRange,
            userId
          );

        case "searchActivities":
          return await this.searchActivities(
            // @ts-ignore
            enrichedParams.query,
            // @ts-ignore
            enrichedParams.filters,
            userId
          );

        case "getActivityTimeline":
          return await this.getActivityTimeline(
            // @ts-ignore
            enrichedParams.startDate,
            // @ts-ignore
            enrichedParams.endDate,
            // @ts-ignore
            enrichedParams.groupBy,
            userId
          );

        case "getUserActivitySummary":
          return await this.getUserActivitySummary(
            // @ts-ignore
            enrichedParams.targetUserId,
            // @ts-ignore
            enrichedParams.days,
            userId
          );

        case "getSystemAuditLog":
          return await this.getSystemAuditLog(
            // @ts-ignore
            enrichedParams.startDate,
            // @ts-ignore
            enrichedParams.endDate,
            // @ts-ignore
            enrichedParams.actions,
            userId
          );

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("UserActivityHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("UserActivityHandler error:", error);
      }
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Internal server error",
        data: null,
      };
    }
  }

  /**
   * Get user activities with pagination and filters
   * @param {object} filters 
   * @param {number} page 
   * @param {number} limit 
   * @param {number} userId 
   */
  // @ts-ignore
  async getUserActivities(filters = {}, page = 1, limit = 50, userId) {
    try {
      const skip = (page - 1) * limit;
      
      // @ts-ignore
      const queryBuilder = this.userActivityRepo
        .createQueryBuilder("activity")
        .leftJoinAndSelect("activity.user", "user")
        .orderBy("activity.created_at", "DESC");

      // Apply filters
      // @ts-ignore
      if (filters.userId) {
        // @ts-ignore
        queryBuilder.andWhere("activity.user_id = :userId", { userId: filters.userId });
      }

      // @ts-ignore
      if (filters.action) {
        // @ts-ignore
        queryBuilder.andWhere("activity.action LIKE :action", { action: `%${filters.action}%` });
      }

      // @ts-ignore
      if (filters.entity) {
        // @ts-ignore
        queryBuilder.andWhere("activity.entity = :entity", { entity: filters.entity });
      }

      // @ts-ignore
      if (filters.startDate && filters.endDate) {
        queryBuilder.andWhere("activity.created_at BETWEEN :startDate AND :endDate", {
          // @ts-ignore
          startDate: filters.startDate,
          // @ts-ignore
          endDate: filters.endDate,
        });
      // @ts-ignore
      } else if (filters.startDate) {
        // @ts-ignore
        queryBuilder.andWhere("activity.created_at >= :startDate", { startDate: filters.startDate });
      // @ts-ignore
      } else if (filters.endDate) {
        // @ts-ignore
        queryBuilder.andWhere("activity.created_at <= :endDate", { endDate: filters.endDate });
      }

      // @ts-ignore
      if (filters.ipAddress) {
        queryBuilder.andWhere("activity.ip_address LIKE :ipAddress", { 
          // @ts-ignore
          ipAddress: `%${filters.ipAddress}%` 
        });
      }

      // Get total count for pagination
      const total = await queryBuilder.getCount();
      
      // Apply pagination
      queryBuilder.skip(skip).take(limit);

      const activities = await queryBuilder.getMany();

      return {
        status: true,
        message: "User activities retrieved successfully",
        data: {
          activities,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasMore: skip + limit < total,
          },
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get activities for a specific user
   * @param {number} targetUserId 
   * @param {number} limit 
   * @param {number} userId 
   */
  // @ts-ignore
  async getActivitiesByUser(targetUserId, limit = 30, userId) {
    try {
      if (!targetUserId) {
        return { status: false, message: "User ID is required", data: null };
      }

      // @ts-ignore
      const activities = await this.userActivityRepo
        .createQueryBuilder("activity")
        .leftJoinAndSelect("activity.user", "user")
        .where("activity.user_id = :targetUserId", { targetUserId })
        .orderBy("activity.created_at", "DESC")
        .limit(limit)
        .getMany();

      return {
        status: true,
        message: `Activities for user ${targetUserId} retrieved successfully`,
        data: activities,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get activities by action type
   * @param {string} action 
   * @param {number} limit 
   * @param {number} userId 
   */
  // @ts-ignore
  async getActivitiesByAction(action, limit = 50, userId) {
    try {
      if (!action) {
        return { status: false, message: "Action is required", data: null };
      }

      // @ts-ignore
      const activities = await this.userActivityRepo
        .createQueryBuilder("activity")
        .leftJoinAndSelect("activity.user", "user")
        .where("activity.action LIKE :action", { action: `%${action}%` })
        .orderBy("activity.created_at", "DESC")
        .limit(limit)
        .getMany();

      return {
        status: true,
        message: `Activities with action '${action}' retrieved successfully`,
        data: activities,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get activities for a specific entity
   * @param {string} entity 
   * @param {number} entityId 
   * @param {number} limit 
   * @param {number} userId 
   */
  // @ts-ignore
  async getActivitiesByEntity(entity, entityId = null, limit = 30, userId) {
    try {
      if (!entity) {
        return { status: false, message: "Entity is required", data: null };
      }

      // @ts-ignore
      const queryBuilder = this.userActivityRepo
        .createQueryBuilder("activity")
        .leftJoinAndSelect("activity.user", "user")
        .where("activity.entity = :entity", { entity })
        .orderBy("activity.created_at", "DESC");

      if (entityId) {
        queryBuilder.andWhere("activity.entity_id = :entityId", { entityId });
      }

      queryBuilder.limit(limit);

      const activities = await queryBuilder.getMany();

      return {
        status: true,
        message: `Activities for ${entity}${entityId ? ` ID ${entityId}` : ''} retrieved successfully`,
        data: activities,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get most recent activities
   * @param {number} limit 
   * @param {number} userId 
   */
  // @ts-ignore
  async getRecentActivities(limit = 20, userId) {
    try {
      // @ts-ignore
      const activities = await this.userActivityRepo
        .createQueryBuilder("activity")
        .leftJoinAndSelect("activity.user", "user")
        .orderBy("activity.created_at", "DESC")
        .limit(limit)
        .getMany();

      return {
        status: true,
        message: "Recent activities retrieved successfully",
        data: activities,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get activity statistics
   * @param {object} dateRange 
   * @param {number} userId 
   */
  // @ts-ignore
  async getActivityStats(dateRange = {}, userId) {
    try {
      // @ts-ignore
      const { startDate, endDate } = dateRange;
      
      // @ts-ignore
      const queryBuilder = this.userActivityRepo
        .createQueryBuilder("activity")
        .select([
          "COUNT(activity.id) as total_activities",
          "COUNT(DISTINCT activity.user_id) as unique_users",
          "COUNT(DISTINCT activity.action) as unique_actions",
          "COUNT(DISTINCT activity.entity) as unique_entities",
        ]);

      // Apply date range if provided
      if (startDate && endDate) {
        queryBuilder.where("activity.created_at BETWEEN :startDate AND :endDate", {
          startDate,
          endDate,
        });
      } else if (startDate) {
        queryBuilder.where("activity.created_at >= :startDate", { startDate });
      } else if (endDate) {
        queryBuilder.where("activity.created_at <= :endDate", { endDate });
      }

      const stats = await queryBuilder.getRawOne();

      // Get top 5 actions
      // @ts-ignore
      const topActions = await this.userActivityRepo
        .createQueryBuilder("activity")
        .select(["activity.action", "COUNT(activity.id) as count"])
        .groupBy("activity.action")
        .orderBy("count", "DESC")
        .limit(5)
        .getRawMany();

      // Get top 5 active users
      // @ts-ignore
      const topUsers = await this.userActivityRepo
        .createQueryBuilder("activity")
        .select([
          "activity.user_id",
          "user.username",
          "COUNT(activity.id) as activity_count"
        ])
        .leftJoin("activity.user", "user")
        .groupBy("activity.user_id, user.username")
        .orderBy("activity_count", "DESC")
        .limit(5)
        .getRawMany();

      return {
        status: true,
        message: "Activity statistics retrieved successfully",
        data: {
          ...stats,
          top_actions: topActions,
          top_users: topUsers,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search activities by text query
   * @param {string} query 
   * @param {object} filters 
   * @param {number} userId 
   */
  // @ts-ignore
  async searchActivities(query, filters = {}, userId) {
    try {
      if (!query || query.trim().length < 2) {
        return { 
          status: false, 
          message: "Search query must be at least 2 characters", 
          data: null 
        };
      }

      const searchQuery = `%${query}%`;
      
      // @ts-ignore
      const queryBuilder = this.userActivityRepo
        .createQueryBuilder("activity")
        .leftJoinAndSelect("activity.user", "user")
        .where("activity.action LIKE :query", { query: searchQuery })
        .orWhere("activity.entity LIKE :query", { query: searchQuery })
        .orWhere("activity.details LIKE :query", { query: searchQuery })
        .orWhere("activity.ip_address LIKE :query", { query: searchQuery })
        .orWhere("user.username LIKE :query", { query: searchQuery })
        .orderBy("activity.created_at", "DESC")
        .limit(100);

      // Apply additional filters
      // @ts-ignore
      if (filters.startDate) {
        queryBuilder.andWhere("activity.created_at >= :startDate", { 
          // @ts-ignore
          startDate: filters.startDate 
        });
      }

      // @ts-ignore
      if (filters.endDate) {
        queryBuilder.andWhere("activity.created_at <= :endDate", { 
          // @ts-ignore
          endDate: filters.endDate 
        });
      }

      const activities = await queryBuilder.getMany();

      return {
        status: true,
        message: "Search completed successfully",
        data: {
          activities,
          count: activities.length,
          query,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get activity timeline grouped by date
   * @param {string} startDate 
   * @param {string} endDate 
   * @param {string} groupBy - day, week, month
   * @param {number} userId 
   */
  // @ts-ignore
  async getActivityTimeline(startDate, endDate, groupBy = 'day', userId) {
    try {
      if (!startDate || !endDate) {
        return { 
          status: false, 
          message: "Start date and end date are required", 
          data: null 
        };
      }

      let dateFormat;
      let groupByClause;

      switch (groupBy) {
        case 'day':
          dateFormat = '%Y-%m-%d';
          groupByClause = 'DATE(activity.created_at)';
          break;
        case 'week':
          dateFormat = '%Y-%W';
          groupByClause = 'YEARWEEK(activity.created_at, 3)';
          break;
        case 'month':
          dateFormat = '%Y-%m';
          groupByClause = 'DATE_FORMAT(activity.created_at, "%Y-%m")';
          break;
        default:
          dateFormat = '%Y-%m-%d';
          groupByClause = 'DATE(activity.created_at)';
      }

      // @ts-ignore
      const timeline = await this.userActivityRepo
        .createQueryBuilder("activity")
        .select([
          `${groupByClause} as period`,
          'COUNT(activity.id) as activity_count',
          'COUNT(DISTINCT activity.user_id) as user_count',
        ])
        .where("activity.created_at BETWEEN :startDate AND :endDate", {
          startDate,
          endDate,
        })
        .groupBy("period")
        .orderBy("period", "ASC")
        .getRawMany();

      return {
        status: true,
        message: "Activity timeline retrieved successfully",
        data: {
          timeline,
          startDate,
          endDate,
          groupBy,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get summary of user activities
   * @param {number} targetUserId 
   * @param {number} days 
   * @param {number} userId 
   */
  // @ts-ignore
  async getUserActivitySummary(targetUserId, days = 30, userId) {
    try {
      if (!targetUserId) {
        return { status: false, message: "User ID is required", data: null };
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // @ts-ignore
      const summary = await this.userActivityRepo
        .createQueryBuilder("activity")
        .select([
          "activity.action",
          "COUNT(activity.id) as count",
          "MAX(activity.created_at) as last_activity"
        ])
        .where("activity.user_id = :targetUserId", { targetUserId })
        .andWhere("activity.created_at >= :startDate", { startDate })
        .groupBy("activity.action")
        .orderBy("count", "DESC")
        .getRawMany();

      // Get total activities count
      // @ts-ignore
      const total = await this.userActivityRepo
        .createQueryBuilder("activity")
        .where("activity.user_id = :targetUserId", { targetUserId })
        .andWhere("activity.created_at >= :startDate", { startDate })
        .getCount();

      // Get most active day
      // @ts-ignore
      const mostActiveDay = await this.userActivityRepo
        .createQueryBuilder("activity")
        .select([
          "DATE(activity.created_at) as date",
          "COUNT(activity.id) as count"
        ])
        .where("activity.user_id = :targetUserId", { targetUserId })
        .andWhere("activity.created_at >= :startDate", { startDate })
        .groupBy("DATE(activity.created_at)")
        .orderBy("count", "DESC")
        .limit(1)
        .getRawOne();

      return {
        status: true,
        message: "User activity summary retrieved successfully",
        data: {
          user_id: targetUserId,
          period_days: days,
          total_activities: total,
          summary_by_action: summary,
          most_active_day: mostActiveDay,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get system audit log (for security/audit purposes)
   * @param {string} startDate 
   * @param {string} endDate 
   * @param {string[]} actions - specific actions to filter
   * @param {number} userId 
   */
  // @ts-ignore
  async getSystemAuditLog(startDate, endDate, actions = [], userId) {
    try {
      // Define audit-relevant actions (modify as needed)
      const auditActions = [
        'LOGIN', 'LOGOUT', 'USER_CREATE', 'USER_UPDATE', 'USER_DELETE',
        'ROLE_CHANGE', 'PERMISSION_CHANGE', 'SYSTEM_SETTINGS_CHANGE',
        'DATA_EXPORT', 'DATA_IMPORT', 'SECURITY_SETTINGS_CHANGE'
      ];

      // @ts-ignore
      const queryBuilder = this.userActivityRepo
        .createQueryBuilder("activity")
        .leftJoinAndSelect("activity.user", "user")
        .where("activity.action IN (:...actions)", { 
          actions: actions.length > 0 ? actions : auditActions 
        })
        .orderBy("activity.created_at", "DESC");

      if (startDate) {
        queryBuilder.andWhere("activity.created_at >= :startDate", { startDate });
      }

      if (endDate) {
        queryBuilder.andWhere("activity.created_at <= :endDate", { endDate });
      }

      const auditLog = await queryBuilder.getMany();

      return {
        status: true,
        message: "System audit log retrieved successfully",
        data: {
          audit_log: auditLog,
          count: auditLog.length,
          start_date: startDate,
          end_date: endDate,
          actions_filtered: actions.length > 0 ? actions : auditActions,
        },
      };
    } catch (error) {
      throw error;
    }
  }
}

// Register IPC handler
const userActivityHandler = new UserActivityHandler();

ipcMain.handle(
  "userActivity",
  withErrorHandling(
    // @ts-ignore
    userActivityHandler.handleRequest.bind(userActivityHandler),
    "IPC:userActivity"
  )
);

module.exports = { UserActivityHandler, userActivityHandler };