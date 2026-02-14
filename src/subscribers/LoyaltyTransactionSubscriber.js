// src/subscribers/LoyaltyTransactionSubscriber.js

//@ts-check
const LoyaltyTransaction = require("../entities/LoyaltyTransaction");

console.log("[Subscriber] Loading LoyaltyTransactionSubscriber");

class LoyaltyTransactionSubscriber {
  listenTo() {
    return LoyaltyTransaction;
  }

  /**
   * @param {{ entity: { id: any; pointsChange: any; timestamp: any; }; }} event
   */
  afterInsert(event) {
    console.log("[LoyaltyTransactionSubscriber] afterInsert:", {
      id: event.entity?.id,
      pointsChange: event.entity?.pointsChange,
      timestamp: event.entity?.timestamp,
    });
  }

  /**
   * @param {{ entity: { id: any; }; updatedColumns: any[]; }} event
   */
  afterUpdate(event) {
    console.log("[LoyaltyTransactionSubscriber] afterUpdate:", {
      id: event.entity?.id,
      updated: event.updatedColumns?.map(c => c.propertyName),
    });
  }

  /**
   * @param {{ entityId: any; entity: { id: any; }; }} event
   */
  afterRemove(event) {
    console.log("[LoyaltyTransactionSubscriber] afterRemove:", {
      id: event.entityId || event.entity?.id,
    });
  }
}

module.exports = LoyaltyTransactionSubscriber;
