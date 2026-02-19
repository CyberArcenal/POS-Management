// src/subscribers/CustomerSubscriber.js
//@ts-check
const Customer = require("../entities/Customer");
const { logger } = require("../utils/logger");

console.log("[Subscriber] Loading CustomerSubscriber");

class CustomerSubscriber {
  listenTo() {
    return Customer;
  }

  /**
   * @param {any} entity
   */
  async beforeInsert(entity) {
    try {
      // @ts-ignore
      logger.info("[CustomerSubscriber] beforeInsert", {
        id: entity.id,
        name: entity.name,
        loyaltyPointsBalance: entity.loyaltyPointsBalance,
      });
    } catch (err) {
      // @ts-ignore
      logger.error("[CustomerSubscriber] beforeInsert error", err);
    }
  }

  /**
   * @param {any} entity
   */
  async afterInsert(entity) {
    try {
      // @ts-ignore
      logger.info("[CustomerSubscriber] afterInsert", {
        id: entity.id,
        name: entity.name,
        loyaltyPointsBalance: entity.loyaltyPointsBalance,
      });
    } catch (err) {
      // @ts-ignore
      logger.error("[CustomerSubscriber] afterInsert error", err);
    }
  }

  /**
   * @param {any} entity
   */
  async beforeUpdate(entity) {
    try {
      // @ts-ignore
      logger.info("[CustomerSubscriber] beforeUpdate", {
        id: entity.id,
      });
    } catch (err) {
      // @ts-ignore
      logger.error("[CustomerSubscriber] beforeUpdate error", err);
    }
  }

  /**
   * @param {{ databaseEntity?: any; entity: any }} event
   */
  async afterUpdate(event) {
    try {
      const { entity } = event;
      // @ts-ignore
      logger.info("[CustomerSubscriber] afterUpdate", {
        id: entity.id,
      });
    } catch (err) {
      // @ts-ignore
      logger.error("[CustomerSubscriber] afterUpdate error", err);
    }
  }

  /**
   * @param {any} entity
   */
  async beforeRemove(entity) {
    try {
      // @ts-ignore
      logger.info("[CustomerSubscriber] beforeRemove", {
        id: entity.id,
      });
    } catch (err) {
      // @ts-ignore
      logger.error("[CustomerSubscriber] beforeRemove error", err);
    }
  }

  /**
   * @param {{ databaseEntity?: any; entityId: any }} event
   */
  async afterRemove(event) {
    try {
      // @ts-ignore
      logger.info("[CustomerSubscriber] afterRemove", {
        id: event.entityId,
      });
    } catch (err) {
      // @ts-ignore
      logger.error("[CustomerSubscriber] afterRemove error", err);
    }
  }
}

module.exports = CustomerSubscriber;