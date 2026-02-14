// src/subscribers/CustomerSubscriber.js

//@ts-check
const Customer = require("../entities/Customer");

console.log("[Subscriber] Loading CustomerSubscriber");

class CustomerSubscriber {
  listenTo() {
    return Customer;
  }

  /**
   * @param {{ entity: { id: any; name: any; loyaltyPointsBalance: any; }; }} event
   */
  afterInsert(event) {
    console.log("[CustomerSubscriber] afterInsert:", {
      id: event.entity?.id,
      name: event.entity?.name,
      loyaltyPointsBalance: event.entity?.loyaltyPointsBalance,
    });
  }

  /**
   * @param {{ entity: { id: any; }; updatedColumns: any[]; }} event
   */
  afterUpdate(event) {
    console.log("[CustomerSubscriber] afterUpdate:", {
      id: event.entity?.id,
      updated: event.updatedColumns?.map(c => c.propertyName),
    });
  }

  /**
   * @param {{ entityId: any; entity: { id: any; }; }} event
   */
  afterRemove(event) {
    console.log("[CustomerSubscriber] afterRemove:", {
      id: event.entityId || event.entity?.id,
    });
  }
}

module.exports = CustomerSubscriber;
