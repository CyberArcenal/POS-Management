// src/channels/email.sender.js
//@ts-check
const nodemailer = require("nodemailer");
const PQueue = require("p-queue").default;
const NotificationLog = require("../entities/NotificationLog");
const { logger } = require("../utils/logger");
const { AppDataSource } = require("../main/db/datasource");


class EmailSender {
  constructor() {
    this.queue = new PQueue({ concurrency: 1 });
    this.maxRetries = 3;
    this.retryDelay = 2000;
  }

  /**
   * @param {string} to
   * @param {string} subject
   * @param {string} html
   * @param {string} text
   * @param {object} options
   * @param {boolean} asyncMode
   * @param {number|null} bookingId
   */
  async send(
    to,
    subject,
    html,
    text,
    options = {},
    asyncMode = true,
    bookingId = null,
  ) {
    if (asyncMode) {
      this.queue.add(() =>
        this._sendWithRetry(to, subject, html, text, options, bookingId),
      );
      logger.info(`📥 Queued email → To: ${to}, Subject: "${subject}"`);
      return { success: true, queued: true };
    } else {
      return await this._sendWithRetry(
        to,
        subject,
        html,
        text,
        options,
        bookingId,
      );
    }
  }

  /**
   * @private
   */
  // @ts-ignore
  async _sendWithRetry(to, subject, html, text, options, bookingId) {
    let attempt = 0;
    let lastError;

    while (attempt < this.maxRetries) {
      attempt++;
      try {
        logger.info(
          `📨 Attempt ${attempt} sending email → To: ${to}, Subject: "${subject}"`,
        );

        // 1. Create/update log entry (QUEUED or RETRY)
        const log = await this._updateLog(
          to,
          subject,
          html,
          bookingId,
          attempt === 1 ? "queued" : "resend", // first attempt = queued, retries = resend
          attempt,
          null,
        );

        // 2. Actually send the email
        const result = await this._sendInternal(
          to,
          subject,
          html,
          text,
          options,
        );

        // 3. Mark as sent
        await this._updateLog(
          to,
          subject,
          html,
          bookingId,
          "sent",
          attempt,
          null,
          log?.id, // pass the log ID so we update the same row
        );

        logger.info(`✅ Email sent → To: ${to}, Attempt: ${attempt}`);
        return result;
      } catch (error) {
        lastError = error;
        // @ts-ignore
        logger.error(`❌ Attempt ${attempt} failed → To: ${to}`, error);

        // Update log with failure (always update the existing row)
        await this._updateLog(
          to,
          subject,
          html,
          bookingId,
          "failed",
          attempt,
          // @ts-ignore
          error.message,
        );

        if (attempt < this.maxRetries) {
          logger.warn(`⏳ Retrying in ${this.retryDelay / 1000}s...`);
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        }
      }
    }

    // Final failure – rethrow after all retries
    throw lastError;
  }

  /**
   * @private
   */
  // @ts-ignore
  async _sendInternal(to, subject, html, text, options = {}) {
    const {
      enableEmailAlerts,
      smtpHost,
      smtpPort,
      smtpUsername,
      smtpPassword,
      companyName,
      // @ts-ignore
      smtpFromName,
      smtpFromEmail,
    } = require("../utils/system");

    if (!(await enableEmailAlerts())) {
      throw new Error("Email notifications are disabled");
    }

    const host = await smtpHost();
    const port = await smtpPort();

    const transporter = nodemailer.createTransport({
      // @ts-ignore
      host,
      port,
      secure: port === 465,
      auth: {
        user: await smtpUsername(),
        pass: await smtpPassword(),
      },
    });

    const mailOptions = {
      from: `${await companyName()} <${await smtpFromEmail()}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""),
      ...options,
    };

    const info = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  }

  /**
   * Upsert a notification log entry.
   * Waits for the database to be ready (retries up to 10 times).
   * @private
   */
  async _updateLog(
    // @ts-ignore
    to,
    // @ts-ignore
    subject,
    // @ts-ignore
    html,
    // @ts-ignore
    bookingId,
    // @ts-ignore
    status,
    // @ts-ignore
    retryCount,
    errorMessage = null,
    existingLogId = null,
  ) {
    const { saveDb } = require("../utils/dbUtils/dbActions");
    // Wait for DB connection (non‑blocking, with backoff)
    await this._waitForDbReady();

    const repo = AppDataSource.getRepository(NotificationLog);

    try {
      let log = null;

      // 1. If we have an existingLogId, fetch that row
      if (existingLogId) {
        log = await repo.findOneBy({ id: existingLogId });
      }

      // 2. Otherwise try to find by booking + recipient (unique per attempt series)
      if (!log && bookingId) {
        log = await repo.findOne({
          where: {
            // @ts-ignore
            booking: { id: bookingId },
            recipient_email: to,
          },
          order: { created_at: "DESC" }, // get the latest
        });
      }

      // 3. Still not found? Create a new one
      if (!log) {
        log = repo.create({
          // @ts-ignore
          booking: bookingId ? { id: bookingId } : null,
          recipient_email: to,
          subject,
          payload: html,
          status,
          retry_count: retryCount,
          error_message: errorMessage,
          sent_at: status === "sent" ? new Date() : null,
          last_error_at: status === "failed" ? new Date() : null,
        });
      } else {
        // Update existing log – increment counters, change status, etc.
        log.status = status;
        log.retry_count = retryCount; // will increase on each attempt
        if (status === "sent") {
          log.sent_at = new Date();
          log.error_message = null;
        } else if (status === "failed") {
          log.last_error_at = new Date();
          log.error_message = errorMessage;
        } else if (status === "resend") {
          // @ts-ignore
          log.resend_count = (log.resend_count || 0) + 1;
        }
      }

      const saved = await saveDb(repo, log);
      logger.debug(
        `📌 NotificationLog ${saved.id} → Status: ${status}, Retry: ${retryCount}`,
      );
      return saved;
    } catch (err) {
      logger.error(
        "❌ Failed to update NotificationLog (will retry later)",
        // @ts-ignore
        err,
      );
      // We do NOT throw – email sending should continue even if logging fails temporarily.
      // The log will be retried on the next attempt.
      return null;
    }
  }

  /**
   * Wait for TypeORM DataSource to be initialised.
   * Retries up to 20 times with exponential backoff.
   * @private
   */
  async _waitForDbReady() {
    const maxAttempts = 20;
    let delay = 50; // ms

    for (let i = 0; i < maxAttempts; i++) {
      if (AppDataSource.isInitialized) {
        return true;
      }
      logger.debug(
        `⏳ Waiting for database connection... (${i + 1}/${maxAttempts})`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * 1.5, 2000); // cap at 2s
    }

    logger.error(
      "❌ Database not ready after maximum attempts – logging skipped",
    );
    return false;
  }
}

module.exports = new EmailSender();
