// src/subscribers/InventoryMovementSubscriber.js

//@ts-check
const InventoryMovement = require("../entities/InventoryMovement");

console.log("[Subscriber] Loading InventoryMovementSubscriber");

class InventoryMovementSubscriber {
  listenTo() {
    return InventoryMovement;
  }

  /**
   * @param {{ entity: { id: any; movementType: any; qtyChange: any; }; }} event
   */
  afterInsert(event) {
    console.log("[InventoryMovementSubscriber] afterInsert:", {
      id: event.entity?.id,
      movementType: event.entity?.movementType,
      qtyChange: event.entity?.qtyChange,
    });
  }

  /**
   * @param {{ entity: { id: any; }; updatedColumns: any[]; }} event
   */
  afterUpdate(event) {
    console.log("[InventoryMovementSubscriber] afterUpdate:", {
      id: event.entity?.id,
      updated: event.updatedColumns?.map(c => c.propertyName),
    });
  }

  /**
   * @param {{ entityId: any; entity: { id: any; }; }} event
   */
  afterRemove(event) {
    console.log("[InventoryMovementSubscriber] afterRemove:", {
      id: event.entityId || event.entity?.id,
    });
  }
}

module.exports = InventoryMovementSubscriber;
