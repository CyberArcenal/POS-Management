// src/subscribers/SaleSubscriber.js

//@ts-check
const Sale = require("../entities/Sale");

console.log("[Subscriber] Loading SaleSubscriber");

class SaleSubscriber {
  listenTo() {
    return Sale;
  }

  /**
   * Triggered after a Sale is inserted
   * @param {{ entity: { id: any; status: any; paymentMethod: any; totalAmount: any; }; }} event
   */
  afterInsert(event) {
    console.log("[SaleSubscriber] afterInsert:", {
      id: event.entity?.id,
      status: event.entity?.status,
      paymentMethod: event.entity?.paymentMethod,
      totalAmount: event.entity?.totalAmount,
    });
  }

  /**
   * Triggered after a Sale is updated
   * @param {{ entity: { id: any; }; updatedColumns: any[]; }} event
   */
  afterUpdate(event) {
    console.log("[SaleSubscriber] afterUpdate:", {
      id: event.entity?.id,
      updated: event.updatedColumns?.map(
        (/** @type {{ propertyName: string }} */ c) => c.propertyName
      ),
    });
  }

  /**
   * Triggered after a Sale is removed
   * @param {{ entityId: any; entity: { id: any; }; }} event
   */
  afterRemove(event) {
    console.log("[SaleSubscriber] afterRemove:", {
      id: event.entityId || event.entity?.id,
    });
  }
}

module.exports = SaleSubscriber;
