//@ts-check
const ReturnRefund = require("../entities/ReturnRefund");
const { ReturnRefundStateTransitionService } = require("../StateTransitionServices/ReturnRefund");

console.log("[Subscriber] Loading ReturnRefundSubscriber");

class ReturnRefundSubscriber {
  listenTo() {
    return ReturnRefund;
  }

  /**
   * @param {{ entity: any; manager: any; }} event
   */
  async afterInsert(event) {
    const { entity, manager } = event;
    if (!entity) return;

    console.log("[ReturnRefundSubscriber] afterInsert:", {
      id: entity.id,
      status: entity.status,
    });

    // If status is not 'pending', we need to trigger the appropriate transition
    if (entity.status !== "pending") {
      const fullReturn = await manager.findOne(ReturnRefund, {
        where: { id: entity.id },
        relations: ["items", "items.product", "sale", "customer"],
      });

      const transitionService = new ReturnRefundStateTransitionService(manager.connection);

      switch (entity.status) {
        case "processed":
          await transitionService.onProcess(fullReturn);
          break;
        case "cancelled":
          // Inserted directly as cancelled – treat as if it was pending before
          await transitionService.onCancel(fullReturn, "pending");
          break;
        // other statuses if any
      }
    }
  }

  /**
   * @param {{ entity: any; databaseEntity: any; manager: any; }} event
   */
  async afterUpdate(event) {
    const { entity, databaseEntity, manager } = event;
    if (!entity) return;

    console.log("[ReturnRefundSubscriber] afterUpdate:", {
      id: entity.id,
      oldStatus: databaseEntity?.status,
      newStatus: entity.status,
    });

    // If status didn't change, do nothing
    if (databaseEntity && databaseEntity.status === entity.status) {
      return;
    }

    // Fetch full entity with relations
    const fullReturn = await manager.findOne(ReturnRefund, {
      where: { id: entity.id },
      relations: ["items", "items.product", "sale", "customer"],
    });

    const transitionService = new ReturnRefundStateTransitionService(manager.connection);

    switch (entity.status) {
      case "processed":
        await transitionService.onProcess(fullReturn);
        break;
      case "cancelled":
        await transitionService.onCancel(fullReturn, databaseEntity.status);
        break;
      // other statuses if any
    }
  }

  // Keep other hooks for logging if needed
  /**
   * @param {{ entity: { sale: { id: any; }; status: any; }; }} event
   */
  beforeInsert(event) {
    console.log("[ReturnRefundSubscriber] beforeInsert:", {
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