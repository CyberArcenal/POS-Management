// src/subscribers/ProductSubscriber.js

//@ts-check
const Product = require("../entities/Product");

console.log("[Subscriber] Loading ProductSubscriber");

class ProductSubscriber {
  listenTo() {
    return Product;
  }

  /**
   * @param {{ entity: { id: any; name: any; stockQty: any; }; }} event
   */
  afterInsert(event) {
    console.log("[ProductSubscriber] afterInsert:", {
      id: event.entity?.id,
      name: event.entity?.name,
      stockQty: event.entity?.stockQty,
    });
  }

  /**
   * @param {{ entity: { id: any; }; updatedColumns: any[]; }} event
   */
  afterUpdate(event) {
    console.log("[ProductSubscriber] afterUpdate:", {
      id: event.entity?.id,
      updated: event.updatedColumns?.map(c => c.propertyName),
    });
  }

  /**
   * @param {{ entityId: any; entity: { id: any; }; }} event
   */
  afterRemove(event) {
    console.log("[ProductSubscriber] afterRemove:", {
      id: event.entityId || event.entity?.id,
    });
  }
}

module.exports = ProductSubscriber;
