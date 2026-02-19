// src/utils/dbActions.js
// @ts-check
const { loadSubscribers } = require("./subscriberRegistry");
const subscribers = loadSubscribers();

/**
 * Hanapin ang subscriber na naka‑listen sa isang entity class.
 *
 * @param {Function} entityClass - Ang entity class (hal. Sale, Product, etc.)
 * @returns {any | undefined} - Ang subscriber instance kung meron, undefined kung wala.
 */
function findSubscriber(entityClass) {
  return subscribers.find((sub) => sub.listenTo() === entityClass);
}

/**
 * I-save ang entity sa database gamit ang repository at i-trigger ang subscriber lifecycle.
 *
 * @template T
 * @param {{ target: Function; save: (entity: T) => Promise<T>; findOne: (opts: any) => Promise<T | null> }} repo - TypeORM repository object.
 * @param {T} entity - Ang entity object na ipe-persist.
 * @returns {Promise<T>} - Ang na-save na entity mula sa database.
 */
async function saveDb(repo, entity) {
  const subscriber = findSubscriber(repo.target);

  if (subscriber?.beforeInsert) {
    await subscriber.beforeInsert(entity);
  }

  const result = await repo.save(entity);

  if (subscriber?.afterInsert) {
    await subscriber.afterInsert(result);
  }

  return result;
}

/**
 * I-update ang entity sa database at i-trigger ang subscriber lifecycle.
 *
 * @template T
 * @param {{ target: Function; save: (entity: T) => Promise<T>; findOne: (opts: any) => Promise<T | null> }} repo - TypeORM repository object.
 * @param {T} entity - Ang entity object na ipe-persist (dapat may `id`).
 * @returns {Promise<T>} - Ang updated na entity mula sa database.
 */
async function updateDb(repo, entity) {
  const subscriber = findSubscriber(repo.target);

  // Fetch old snapshot from DB for audit clarity
  // @ts-ignore
  const oldEntity = await repo.findOne({ where: { id: entity.id } });

  if (subscriber?.beforeUpdate) {
    await subscriber.beforeUpdate(entity);
  }

  const result = await repo.save(entity);

  if (subscriber?.afterUpdate) {
    await subscriber.afterUpdate({ databaseEntity: oldEntity, entity: result });
  }

  return result;
}

/**
 * I-remove ang entity sa database at i-trigger ang subscriber lifecycle.
 *
 * @template T
 * @param {{ target: Function; remove: (entity: T) => Promise<T>; findOne: (opts: any) => Promise<T | null> }} repo - TypeORM repository object.
 * @param {T} entity - Ang entity object na ipe-persist (dapat may `id`).
 * @returns {Promise<T>} - Ang na-remove na entity mula sa database.
 */
async function removeDb(repo, entity) {
  const subscriber = findSubscriber(repo.target);

  if (subscriber?.beforeRemove) {
    await subscriber.beforeRemove(entity);
  }

  // Fetch old snapshot for audit clarity
  // @ts-ignore
  const oldEntity = await repo.findOne({ where: { id: entity.id } });

  const result = await repo.remove(entity);

  if (subscriber?.afterRemove) {
    // @ts-ignore
    await subscriber.afterRemove({ databaseEntity: oldEntity, entityId: result.id });
  }

  return result;
}

module.exports = { saveDb, updateDb, removeDb };
