//@ts-check
const ReturnRefund = require("../entities/ReturnRefund");

console.log("[Subscriber] Loading ReturnRefundSubscriber");

class ReturnRefundSubscriber {
  listenTo() {
    return ReturnRefund;
  }

  /**
   * @param {{ entity: { id: any; sale: any; status: any; }; }} event
   */
  beforeInsert(event) {
    console.log("[ReturnRefundSubscriber] beforeInsert:", {
      saleId: event.entity?.sale?.id,
      status: event.entity?.status,
    });
  }

  /**
     * @param {{ entity: { id: any; sale: { id: any; }; status: any; }; }} event
     */
  afterInsert(event) {
    console.log("[ReturnRefundSubscriber] afterInsert:", {
      id: event.entity?.id,
      saleId: event.entity?.sale?.id,
      status: event.entity?.status,
    });
  }

  /**
     * @param {{ entity: { id: any; status: any; }; }} event
     */
  beforeUpdate(event) {
    console.log("[ReturnRefundSubscriber] beforeUpdate:", {
      id: event.entity?.id,
      status: event.entity?.status,
    });
  }

  /**
     * @param {{ entity: { id: any; status: any; }; updatedColumns: any[]; }} event
     */
  afterUpdate(event) {
    console.log("[ReturnRefundSubscriber] afterUpdate:", {
      id: event.entity?.id,
      status: event.entity?.status,
      updated: event.updatedColumns?.map((/** @type {{ propertyName: any; }} */ c) => c.propertyName),
    });
  }

  /**
     * @param {{ entity: { id: any; }; }} event
     */
  beforeRemove(event) {
    console.log("[ReturnRefundSubscriber] beforeRemove:", {
      id: event.entity?.id,
    });
  }

  /**
     * @param {{ entityId: any; entity: { id: any; }; }} event
     */
  afterRemove(event) {
    console.log("[ReturnRefundSubscriber] afterRemove:", {
      id: event.entityId || event.entity?.id,
    });
  }
}

module.exports = ReturnRefundSubscriber;
