// src/subscribers/SaleSubscriber.js
const Sale = require("../entities/Sale");
const { AppDataSource } = require("../main/db/datasource");
const { SaleStateTransitionService } = require("../StateTransitionServices/Sale");

console.log("[Subscriber] Loading SaleSubscriber");

class SaleSubscriber {
  constructor() {
    this.transitionService = new SaleStateTransitionService(AppDataSource);
  }

  listenTo() {
    return Sale;
  }

  async afterInsert(event) {
    if (!event.entity) return;
    console.log("[SaleSubscriber] afterInsert:", { id: event.entity.id, status: event.entity.status });
    // Optional: handle initial creation if needed (e.g., send notification)
  }

  async afterUpdate(event) {
    if (!event.entity) return;

    const oldSale = event.databaseEntity; // the state before update
    const newSale = event.entity;          // the state after update

    console.log("[SaleSubscriber] afterUpdate:", {
      id: newSale.id,
      oldStatus: oldSale?.status,
      newStatus: newSale.status,
    });

    // If status hasn't changed, do nothing
    if (oldSale && oldSale.status === newSale.status) {
      return;
    }

    // Status changed – trigger the appropriate transition
    switch (newSale.status) {
      case "paid":
        await this.transitionService.onPay(newSale);
        break;
      case "refunded":
        await this.transitionService.onRefund(newSale);
        break;
      case "voided":
        await this.transitionService.onCancel(newSale);
        break;
      default:
        // no action for other statuses (e.g., "initiated")
        break;
    }
  }

  async afterRemove(event) {
    console.log("[SaleSubscriber] afterRemove:", { id: event.entityId || event.entity?.id });
    // Optional: cleanup or archival logic
  }
}

module.exports = SaleSubscriber;