// src/subscribers/SaleItemSubscriber.js

//@ts-check
const SaleItem = require("../entities/SaleItem");

console.log("[Subscriber] Loading SaleItemSubscriber");

class SaleItemSubscriber {
  listenTo() {
    return SaleItem;
  }

  /**
   * Triggered after a SaleItem is inserted
   * @param {{ entity: { id: any; quantity: any; unitPrice: any; lineTotal: any; }; }} event
   */
  afterInsert(event) {
    console.log("[SaleItemSubscriber] afterInsert:", {
      id: event.entity?.id,
      quantity: event.entity?.quantity,
      unitPrice: event.entity?.unitPrice,
      lineTotal: event.entity?.lineTotal,
    });
  }

  /**
   * Triggered after a SaleItem is updated
   * @param {{ entity: { id: any; }; updatedColumns: any[]; }} event
   */
  afterUpdate(event) {
    console.log("[SaleItemSubscriber] afterUpdate:", {
      id: event.entity?.id,
      updated: event.updatedColumns?.map(c => c.propertyName),
    });
  }

  /**
   * Triggered after a SaleItem is removed
   * @param {{ entityId: any; entity: { id: any; }; }} event
   */
  afterRemove(event) {
    console.log("[SaleItemSubscriber] afterRemove:", {
      id: event.entityId || event.entity?.id,
    });
  }
}

module.exports = SaleItemSubscriber;
