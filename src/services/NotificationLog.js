// src/services/notificationLog.service.js
//@ts-check
const { AppDataSource } = require("../main/db/datasource");
const NotificationLog = require("../entities/NotificationLog");
const emailSender = require("../channels/email.sender");
const { logger } = require("../utils/logger");


const LOG_STATUS = {
  QUEUED: "queued",
  SENT: "sent",
  FAILED: "failed",
  RESEND: "resend",
};

/**
 * Allowed columns for sorting (prevents SQL injection)
 */
const ALLOWED_SORT_COLUMNS = new Set([
  "id",
  "recipient_email",
  "subject",
  "status",
  "retry_count",
  "resend_count",
  "sent_at",
  "last_error_at",
  "created_at",
  "updated_at",
]);

/**
 * Wraps service methods to avoid repetitive try/catch blocks
 */
// @ts-ignore
async function withErrorHandling(fn, ...args) {
  try {
    return await fn(...args);
  } catch (error) {
    // @ts-ignore
    logger?.error(`${fn.name || "Service"} error:`, error);
    return {
      status: false,
      // @ts-ignore
      message: error?.message || "Unknown error",
      data: null,
    };
  }
}

class NotificationLogService {
  /**
   * Get repository – optionally use queryRunner for transactions
   * @param {import('typeorm').QueryRunner | null} [queryRunner]
   * @returns {import('typeorm').Repository<NotificationLog>}
   */
  getRepository(queryRunner = null) {
    if (queryRunner?.manager) {
      // @ts-ignore
      return queryRunner.manager.getRepository(NotificationLog);
    }
    // @ts-ignore
    return AppDataSource.getRepository(NotificationLog);
  }

  //#region 📋 READ OPERATIONS

  /**
   * @param {Object} params
   * @param {number} [params.page=1]
   * @param {number} [params.limit=50]
   * @param {string} [params.status]
   * @param {Date|string} [params.startDate]
   * @param {Date|string} [params.endDate]
   * @param {string} [params.sortBy='created_at']
   * @param {'ASC'|'DESC'} [params.sortOrder='DESC']
   * @param {import('typeorm').QueryRunner | null} [queryRunner]
   */
  async getAllNotifications(
    {
      page = 1,
      limit = 50,
      status,
      startDate,
      endDate,
      sortBy = "created_at",
      sortOrder = "DESC",
    },
    queryRunner = null,
  ) {
    return withErrorHandling(async () => {
      const repo = this.getRepository(queryRunner);
      const qb = repo.createQueryBuilder("log");

      // Filters
      if (status) qb.andWhere("log.status = :status", { status });
      if (startDate) qb.andWhere("log.created_at >= :startDate", { startDate });
      if (endDate) qb.andWhere("log.created_at <= :endDate", { endDate });

      // Sorting – only allow safe columns
      const safeSortBy = ALLOWED_SORT_COLUMNS.has(sortBy)
        ? sortBy
        : "created_at";
      qb.orderBy(`log.${safeSortBy}`, sortOrder === "DESC" ? "DESC" : "ASC");

      // Pagination
      qb.skip((page - 1) * limit).take(limit);

      // Join booking if relation exists
      qb.leftJoinAndSelect("log.booking", "booking");

      const [data, total] = await qb.getManyAndCount();

      return {
        status: true,
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    });
  }

  /**
   * @param {Object} params
   * @param {number} params.id
   * @param {import('typeorm').QueryRunner | null} [queryRunner]
   */
  async getNotificationById({ id }, queryRunner = null) {
    return withErrorHandling(async () => {
      if (!id) return { status: false, message: "ID is required", data: null };

      const repo = this.getRepository(queryRunner);
      const notification = await repo.findOne({
        // @ts-ignore
        where: { id },
        relations: ["booking"],
      });

      if (!notification) {
        return { status: false, message: "Notification not found", data: null };
      }

      return { status: true, data: notification };
    });
  }

  /**
   * @param {Object} params
   * @param {string} params.recipient_email
   * @param {number} [params.page=1]
   * @param {number} [params.limit=50]
   * @param {import('typeorm').QueryRunner | null} [queryRunner]
   */
  async getNotificationsByRecipient(
    { recipient_email, page = 1, limit = 50 },
    queryRunner = null,
  ) {
    return withErrorHandling(async () => {
      if (!recipient_email) {
        return {
          status: false,
          message: "Recipient email is required",
          data: null,
        };
      }

      const repo = this.getRepository(queryRunner);
      const [data, total] = await repo.findAndCount({
        // @ts-ignore
        where: { recipient_email },
        relations: ["booking"],
        // @ts-ignore
        order: { created_at: "DESC" },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        status: true,
        data,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      };
    });
  }

  /**
   * @param {Object} params
   * @param {number} params.bookingId
   * @param {number} [params.page=1]
   * @param {number} [params.limit=50]
   * @param {import('typeorm').QueryRunner | null} [queryRunner]
   */
  async getNotificationsByBooking(
    { bookingId, page = 1, limit = 50 },
    queryRunner = null,
  ) {
    return withErrorHandling(async () => {
      if (!bookingId) {
        return { status: false, message: "Booking ID is required", data: null };
      }

      const repo = this.getRepository(queryRunner);
      const [data, total] = await repo.findAndCount({
        // @ts-ignore
        where: { booking: { id: bookingId } },
        relations: ["booking"],
        // @ts-ignore
        order: { created_at: "DESC" },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        status: true,
        data,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      };
    });
  }

  /**
   * @param {Object} params
   * @param {string} params.keyword
   * @param {number} [params.page=1]
   * @param {number} [params.limit=50]
   * @param {import('typeorm').QueryRunner | null} [queryRunner]
   */
  async searchNotifications(
    { keyword, page = 1, limit = 50 },
    queryRunner = null,
  ) {
    return withErrorHandling(async () => {
      if (!keyword) {
        return { status: false, message: "Keyword is required", data: null };
      }

      const repo = this.getRepository(queryRunner);
      const qb = repo
        .createQueryBuilder("log")
        .where("log.recipient_email LIKE :keyword", { keyword: `%${keyword}%` })
        .orWhere("log.subject LIKE :keyword", { keyword: `%${keyword}%` })
        .orWhere("log.payload LIKE :keyword", { keyword: `%${keyword}%` })
        .orderBy("log.created_at", "DESC")
        .skip((page - 1) * limit)
        .take(limit)
        .leftJoinAndSelect("log.booking", "booking");

      const [data, total] = await qb.getManyAndCount();

      return {
        status: true,
        data,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      };
    });
  }

  //#endregion

  //#region ✏️ WRITE OPERATIONS

  /**
   * @param {Object} params
   * @param {number} params.id
   * @param {import('typeorm').QueryRunner | null} [queryRunner]
   */
  async deleteNotification({ id }, queryRunner = null) {
    return withErrorHandling(async () => {
      if (!id) return { status: false, message: "ID is required", data: null };

      const repo = this.getRepository(queryRunner);
      // @ts-ignore
      const notification = await repo.findOne({ where: { id } });

      if (!notification) {
        return { status: false, message: "Notification not found", data: null };
      }

      await repo.remove(notification);
      return { status: true, message: "Notification deleted successfully" };
    });
  }

  /**
   * @param {Object} params
   * @param {number} params.id
   * @param {string} params.status
   * @param {string|null} [params.errorMessage=null]
   * @param {import('typeorm').QueryRunner | null} [queryRunner]
   */
  async updateNotificationStatus(
    { id, status, errorMessage = null },
    queryRunner = null,
  ) {
    const { saveDb, updateDb } = require("../utils/dbUtils/dbActions");
    return withErrorHandling(async () => {
      if (!id || !status) {
        return {
          status: false,
          message: "ID and status are required",
          data: null,
        };
      }

      const repo = this.getRepository(queryRunner);
      // @ts-ignore
      const notification = await repo.findOne({ where: { id } });

      if (!notification) {
        return { status: false, message: "Notification not found", data: null };
      }

      // @ts-ignore
      notification.status = status;
      // @ts-ignore
      notification.error_message = errorMessage;

      if (status === LOG_STATUS.SENT) {
        // @ts-ignore
        notification.sent_at = new Date();
      } else if (status === LOG_STATUS.FAILED) {
        // @ts-ignore
        notification.last_error_at = new Date();
      }

      // @ts-ignore
      notification.updated_at = new Date();

      const saved = await updateDb(repo, notification);
      return { status: true, data: saved };
    });
  }

  //#endregion

  //#region 🔄 RETRY / RESEND OPERATIONS

  /**
   * Internal method to send email and update log
   * @private
   */
  // @ts-ignore
  async _sendAndUpdate(notification, isResend = false) {
    const sendResult = await emailSender.send(
      notification.recipient_email,
      notification.subject || "No Subject",
      notification.payload || "",
      // @ts-ignore
      null,
      {},
      false,
      notification.booking?.id || null,
    );

    if (sendResult?.success) {
      notification.status = isResend ? LOG_STATUS.RESEND : LOG_STATUS.SENT;
      notification.sent_at = new Date();
      notification.error_message = null;
      notification.last_error_at = null;
    } else {
      notification.status = LOG_STATUS.FAILED;
      notification.last_error_at = new Date();
      // @ts-ignore
      notification.error_message = sendResult?.error || "Unknown error";
    }

    if (isResend) {
      notification.resend_count = (notification.resend_count || 0) + 1;
    } else {
      notification.retry_count = (notification.retry_count || 0) + 1;
    }

    notification.updated_at = new Date();
    return sendResult;
  }

  /**
   * @param {Object} params
   * @param {number} params.id
   * @param {import('typeorm').QueryRunner | null} [queryRunner]
   */
  async retryFailedNotification({ id }, queryRunner = null) {
    const { saveDb, updateDb } = require("../utils/dbUtils/dbActions");
    return withErrorHandling(async () => {
      if (!id) {
        return {
          status: false,
          message: "Notification ID is required",
          data: null,
        };
      }

      const repo = this.getRepository(queryRunner);
      const notification = await repo.findOne({
        // @ts-ignore
        where: { id },
        relations: ["booking"],
      });

      if (!notification) {
        return { status: false, message: "Notification not found", data: null };
      }

      if (
        // @ts-ignore
        ![LOG_STATUS.FAILED, LOG_STATUS.QUEUED].includes(notification.status)
      ) {
        return {
          status: false,
          // @ts-ignore
          message: `Cannot retry notification with status: ${notification.status}`,
          data: null,
        };
      }
      // @ts-ignore
      notification.resend_count = notification.resend_count + 1;
      const saved = await updateDb(repo, notification);
      let sendResult = null;
      try{
      sendResult = await this._sendAndUpdate(saved, false);
      }catch(err){}

      return {
        status: true,
        data: saved,
        sendResult,
      };
    });
  }

  /**
   * @param {Object} params
   * @param {Object} [params.filters={}]
   * @param {string} [params.filters.recipient_email]
   * @param {Date|string} [params.filters.createdBefore]
   * @param {import('typeorm').QueryRunner | null} [queryRunner]
   */
  async retryAllFailed({ filters = {} }, queryRunner = null) {
    return withErrorHandling(async () => {
      const repo = this.getRepository(queryRunner);
      const qb = repo
        .createQueryBuilder("log")
        .where("log.status IN (:...statuses)", {
          statuses: [LOG_STATUS.FAILED, LOG_STATUS.QUEUED],
        });

      if (filters.recipient_email) {
        qb.andWhere("log.recipient_email = :recipient", {
          recipient: filters.recipient_email,
        });
      }

      if (filters.createdBefore) {
        qb.andWhere("log.created_at <= :before", {
          before: filters.createdBefore,
        });
      }

      const failedNotifications = await qb.getMany();
      const results = [];

      for (const notification of failedNotifications) {
        const result = await this.retryFailedNotification(
          // @ts-ignore
          { id: notification.id },
          queryRunner,
        );
        // @ts-ignore
        results.push({ id: notification.id, ...result });
      }

      const successCount = results.filter((r) => r.sendResult?.success).length;
      const failCount = results.length - successCount;

      return {
        status: true,
        message: `Retried ${results.length} notifications. ${successCount} succeeded, ${failCount} failed.`,
        data: results,
      };
    });
  }

  /**
   * @param {Object} params
   * @param {number} params.id
   * @param {import('typeorm').QueryRunner | null} [queryRunner]
   */
  async resendNotification({ id }, queryRunner = null) {
    const { saveDb, updateDb } = require("../utils/dbUtils/dbActions");
    return withErrorHandling(async () => {
      if (!id) {
        return {
          status: false,
          message: "Notification ID is required",
          data: null,
        };
      }

      const repo = this.getRepository(queryRunner);
      const notification = await repo.findOne({
        // @ts-ignore
        where: { id },
        relations: ["booking"],
      });

      if (!notification) {
        return { status: false, message: "Notification not found", data: null };
      }

      const sendResult = await this._sendAndUpdate(notification, true);
      const saved = await updateDb(repo, notification);

      return {
        status: true,
        data: saved,
        sendResult,
      };
    });
  }

  //#endregion

  //#region 📊 STATISTICS

  /**
   * @param {Object} params
   * @param {Date|string} [params.startDate]
   * @param {Date|string} [params.endDate]
   * @param {import('typeorm').QueryRunner | null} [queryRunner]
   */
  async getNotificationStats({ startDate, endDate }, queryRunner = null) {
    return withErrorHandling(async () => {
      const repo = this.getRepository(queryRunner);
      const qb = repo.createQueryBuilder("log");

      if (startDate) qb.andWhere("log.created_at >= :startDate", { startDate });
      if (endDate) qb.andWhere("log.created_at <= :endDate", { endDate });

      // Status counts
      const statusStats = await qb
        .clone()
        .select("log.status", "status")
        .addSelect("COUNT(log.id)", "count")
        .groupBy("log.status")
        .getRawMany();

      const total = await qb.clone().getCount();

      const avgRetry = await qb
        .clone()
        .where("log.status = :status", { status: LOG_STATUS.FAILED })
        .select("AVG(log.retry_count)", "avg")
        .getRawOne();

      const last24h = await qb
        .clone()
        .where("log.created_at >= :date", {
          date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        })
        .getCount();

      const byStatus = statusStats.reduce((acc, { status, count }) => {
        acc[status] = parseInt(count, 10);
        return acc;
      }, {});

      return {
        status: true,
        data: {
          total,
          byStatus,
          avgRetryFailed: parseFloat(avgRetry?.avg) || 0,
          last24h,
        },
      };
    });
  }

  //#endregion

  //#region 🧩 CREATE (used by email/sms sender)

  /**
   * @param {Object} data
   * @param {string} data.to
   * @param {string} data.subject
   * @param {string} [data.html]
   * @param {string} [data.text]
   * @param {number} [data.bookingId]
   * @param {import('typeorm').QueryRunner | null} [queryRunner]
   */
  async createLog(data, queryRunner = null) {
    const { saveDb, updateDb } = require("../utils/dbUtils/dbActions");
    return withErrorHandling(async () => {
      const repo = this.getRepository(queryRunner);
      const log = repo.create({
        // @ts-ignore
        recipient_email: data.to,
        subject: data.subject,
        payload: data.html || data.text,
        status: LOG_STATUS.QUEUED,
        retry_count: 0,
        resend_count: 0,
        booking: data.bookingId ? { id: data.bookingId } : null,
      });

      const saved = await saveDb(repo, log);
      return { status: true, data: saved };
    });
  }

  //#endregion
}

module.exports = { NotificationLogService, LOG_STATUS };
