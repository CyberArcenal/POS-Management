//@ts-check
const Purchase = require("../entities/Purchase");

console.log("[Subscriber] Loading PurchaseSubscriber");

class PurchaseSubscriber {
  listenTo() {
    return Purchase;
  }

  /**
   * @param {{ entity: { id: any; referenceNo: any; status: any; supplier: any; }; }} event
   */
  beforeInsert(event) {
    console.log("[PurchaseSubscriber] beforeInsert:", {
      referenceNo: event.entity?.referenceNo,
      supplier: event.entity?.supplier?.name,
      status: event.entity?.status,
    });
  }

  /**
     * @param {{ entity: { id: any; referenceNo: any; supplier: { name: any; }; status: any; }; }} event
     */
  afterInsert(event) {
    console.log("[PurchaseSubscriber] afterInsert:", {
      id: event.entity?.id,
      referenceNo: event.entity?.referenceNo,
      supplier: event.entity?.supplier?.name,
      status: event.entity?.status,
    });
  }

  /**
     * @param {{ entity: { id: any; status: any; }; }} event
     */
  beforeUpdate(event) {
    console.log("[PurchaseSubscriber] beforeUpdate:", {
      id: event.entity?.id,
      status: event.entity?.status,
    });
  }

  /**
     * @param {{ entity: { id: any; status: any; }; updatedColumns: any[]; }} event
     */
  afterUpdate(event) {
    console.log("[PurchaseSubscriber] afterUpdate:", {
      id: event.entity?.id,
      status: event.entity?.status,
      updated: event.updatedColumns?.map((/** @type {{ propertyName: any; }} */ c) => c.propertyName),
    });
  }

  /**
     * @param {{ entity: { id: any; }; }} event
     */
  beforeRemove(event) {
    console.log("[PurchaseSubscriber] beforeRemove:", {
      id: event.entity?.id,
    });
  }

  /**
     * @param {{ entityId: any; entity: { id: any; }; }} event
     */
  afterRemove(event) {
    console.log("[PurchaseSubscriber] afterRemove:", {
      id: event.entityId || event.entity?.id,
    });
  }
}

module.exports = PurchaseSubscriber;
