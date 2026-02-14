// utils/dbActions.js
// @ts-check
const { loadSubscribers } = require("./subscriberRegistry");
const subscribers = loadSubscribers();

/**
 * @param {any} entityClass
 */
function findSubscriber(entityClass) {
  return subscribers.find((sub) => sub.listenTo() === entityClass);
}

/**
 * @param {{ target: any; save: (arg0: any) => any; findOne: (opts:any)=>any }} repo
 * @param {any} entity
 */
async function saveDb(repo, entity) {
  const subscriber = findSubscriber(repo.target);

  if (subscriber?.beforeInsert) {
    subscriber.beforeInsert(entity);
  }

  const result = await repo.save(entity);

  if (subscriber?.afterInsert) {
    subscriber.afterInsert(result);
  }

  return result;
}

/**
 * @param {{ target: any; save: (arg0: any) => any; findOne: (opts:any)=>any }} repo
 * @param {any} entity
 */
async function updateDb(repo, entity) {
  const subscriber = findSubscriber(repo.target);

  // Fetch old snapshot from DB for audit clarity
  const oldEntity = await repo.findOne({ where: { id: entity.id } });

  if (subscriber?.beforeUpdate) {
    subscriber.beforeUpdate(entity);
  }

  const result = await repo.save(entity);

  if (subscriber?.afterUpdate) {
    // Pass both old and new entity
    await subscriber.afterUpdate({ databaseEntity: oldEntity, entity: result });
  }

  return result;
}

/**
 * @param {{ target: any; remove: (arg0: any) => any; findOne: (opts:any)=>any }} repo
 * @param {any} entity
 */
async function removeDb(repo, entity) {
  const subscriber = findSubscriber(repo.target);

  if (subscriber?.beforeRemove) {
    subscriber.beforeRemove(entity);
  }

  // Fetch old snapshot for audit clarity
  const oldEntity = await repo.findOne({ where: { id: entity.id } });

  const result = await repo.remove(entity);

  if (subscriber?.afterRemove) {
    subscriber.afterRemove({ databaseEntity: oldEntity, entityId: result.id });
  }

  return result;
}

module.exports = { saveDb, updateDb, removeDb };
