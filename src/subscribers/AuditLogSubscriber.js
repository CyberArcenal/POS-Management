// src/subscribers/AuditLogSubscriber.js

//@ts-check
const { AuditLog } = require("../entities/AuditLog");

console.log("[Subscriber] Loading AuditLogSubscriber");

class AuditLogSubscriber {
  listenTo() {
    return AuditLog;
  }

  /**
   * @param {{ entity: { id: any; entity: any; action: any; user: any; }; }} event
   */
  afterInsert(event) {
    console.log("[AuditLogSubscriber] afterInsert:", {
      id: event.entity?.id,
      entity: event.entity?.entity,
      action: event.entity?.action,
      user: event.entity?.user,
    });
  }

  /**
   * @param {{ entity: { id: any; }; updatedColumns: any[]; }} event
   */
  afterUpdate(event) {
    console.log("[AuditLogSubscriber] afterUpdate:", {
      id: event.entity?.id,
      updated: event.updatedColumns?.map(
        (/** @type {{ propertyName: any; }} */ c) => c.propertyName,
      ),
    });
  }

  /**
   * @param {{ entityId: any; entity: { id: any; }; }} event
   */
  afterRemove(event) {
    console.log("[AuditLogSubscriber] afterRemove:", {
      id: event.entityId || event.entity?.id,
    });
  }
}

module.exports = AuditLogSubscriber;
