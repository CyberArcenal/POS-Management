//@ts-check
const Purchase = require("../entities/Purchase");
const { PurchaseStateTransitionService } = require("../StateTransitionServices/Purchase");

console.log("[Subscriber] Loading PurchaseSubscriber");

class PurchaseSubscriber {
  listenTo() {
    return Purchase;
  }

  /**
   * @param {{ entity: any; manager: any; }} event
   */
  async afterInsert(event) {
    const { entity, manager } = event;
    if (!entity) return;

    console.log("[PurchaseSubscriber] afterInsert:", {
      id: entity.id,
      status: entity.status,
    });

    // If status is not 'pending', we need to trigger the appropriate transition
    if (entity.status !== "pending") {
      const fullPurchase = await manager.findOne(Purchase, {
        where: { id: entity.id },
        relations: ["purchaseItems", "purchaseItems.product", "supplier"],
      });

      const transitionService = new PurchaseStateTransitionService(manager.connection);

      switch (entity.status) {
        case "completed":
          await transitionService.onComplete(fullPurchase);
          break;
        case "cancelled":
          // Inserted directly as cancelled – treat as if it was pending before
          await transitionService.onCancel(fullPurchase, "pending");
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

    console.log("[PurchaseSubscriber] afterUpdate:", {
      id: entity.id,
      oldStatus: databaseEntity?.status,
      newStatus: entity.status,
    });

    // If status didn't change, do nothing
    if (databaseEntity && databaseEntity.status === entity.status) {
      return;
    }

    // Fetch full entity with relations
    const fullPurchase = await manager.findOne(Purchase, {
      where: { id: entity.id },
      relations: ["purchaseItems", "purchaseItems.product", "supplier"],
    });

    const transitionService = new PurchaseStateTransitionService(manager.connection);

    switch (entity.status) {
      case "completed":
        await transitionService.onComplete(fullPurchase);
        break;
      case "cancelled":
        await transitionService.onCancel(fullPurchase, databaseEntity.status);
        break;
      // other statuses if any
    }
  }

  // Keep other hooks for logging (optional)
  /**
   * @param {{ entity: { referenceNo: any; supplier: { name: any; }; status: any; }; }} event
   */
  beforeInsert(event) {
    console.log("[PurchaseSubscriber] beforeInsert:", {
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