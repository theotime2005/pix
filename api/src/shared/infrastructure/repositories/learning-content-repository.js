import Dataloader from 'dataloader';

import { knex } from '../../../../db/knex-database-connection.js';
import { LearningContentCache } from '../caches/learning-content-cache.js';
import { Counter } from '../metrics/counter.js';
import { child, SCOPES } from '../utils/logger.js';

const logger = child('learningcontent:repository', { event: SCOPES.LEARNING_CONTENT });

const metrics = {
  loadTotal: new Counter({
    name: 'lc_load_total',
    help: 'Total count of entities loaded from learning content',
    labelNames: ['table'],
  }),
  loadCacheMiss: new Counter({
    name: 'lc_load_cache_miss',
    help: 'Count of cache misses when loading entities from learning content',
    labelNames: ['table'],
  }),
};

/**
 * @typedef {(knex: import('knex').QueryBuilder) => Promise<string[]|number[]>} QueryBuilderCallback
 */

/**
 * Datasource for learning content repositories.
 * This datasource uses a {@link Dataloader} to load and cache entities.
 */
export class LearningContentRepository {
  #tableName;
  #idType;
  #dataloader;
  #findCache;
  #findCacheMiss;
  #metrics;

  /**
   * @param {{
   *   tableName: string
   *   idType?: 'text' | 'integer'
   * }} config
   */
  constructor({ tableName, idType = 'text' }) {
    this.#tableName = tableName;
    this.#idType = idType;

    this.#dataloader = new Dataloader((ids) => this.#batchLoad(ids), {
      cacheMap: new LearningContentCache({ name: `${tableName}:entities` }),
    });

    this.#findCache = new LearningContentCache({ name: `${tableName}:results` });

    this.#findCacheMiss = new Map();

    const table = this.#tableName.split('.').at(-1);
    this.#metrics = {
      loadTotal: metrics.loadTotal.labels({ table }),
      loadCacheMiss: metrics.loadCacheMiss.labels({ table }),
    };
  }

  /**
   * Finds several entities using a request and caches results.
   * The request is built using a knex query builder given to {@link callback}.
   * {@link cacheKey} must vary according to params given to the query builder.
   * @param {string} cacheKey
   * @param {QueryBuilderCallback} callback
   * @returns {Promise<object[]>}
   */
  async find(cacheKey, callback) {
    let dtos = this.#findCache.get(cacheKey);
    if (dtos) return dtos;

    dtos = this.#findCacheMiss.get(cacheKey);
    if (dtos) return dtos;

    dtos = this.#loadDtos(callback, cacheKey).finally(() => {
      this.#findCacheMiss.delete(cacheKey);
    });
    this.#findCacheMiss.set(cacheKey, dtos);

    return dtos;
  }

  /**
   * Loads one entity by ID.
   * @param {string|number} id
   * @returns {Promise<object|null>}
   */
  async load(id) {
    this.#metrics.loadTotal.inc();
    return this.#dataloader.load(id);
  }

  /**
   * Gets several entities by ID.
   * Deduplicates ids and removes nullish ids before loading.
   * @param {string[]|number[]} ids
   * @returns {Promise<(object|null)[]>}
   */
  async getMany(ids) {
    const idsToLoad = new Set(ids);
    idsToLoad.delete(undefined);
    idsToLoad.delete(null);

    const dtos = await this.loadMany(Array.from(idsToLoad));

    return dtos;
  }

  /**
   * Loads several entities by ID.
   * @param {string[]|number[]} ids
   * @returns {Promise<(object|null)[]>}
   */
  async loadMany(ids) {
    return this.#loadMany(ids);
  }

  /**
   * Loads several entities by ID.
   * @param {string[]|number[]} ids
   * @param {string=} cacheKey for debug purposes only
   * @returns {Promise<(object|null)[]>}
   */
  async #loadMany(ids, cacheKey) {
    this.#metrics.loadTotal.inc(ids.length);

    const dtos = await this.#dataloader.loadMany(ids);

    if (dtos[0] instanceof Error) {
      const err = dtos[0];
      logger.error({ tableName: this.#tableName, cacheKey, err }, 'error while loading entities by ids');
      throw new Error('error while loading entities by ids', { cause: err });
    }

    return dtos;
  }

  /**
   * Loads entities from database using a request and writes result to cache.
   * @param {string} cacheKey
   * @param {QueryBuilderCallback} callback
   * @returns {Promise<object[]>}
   */
  async #loadDtos(callback, cacheKey) {
    const ids = await callback(knex.pluck(`${this.#tableName}.id`).from(this.#tableName));

    const dtos = await this.#loadMany(ids, cacheKey);

    logger.debug({ tableName: this.#tableName, cacheKey }, 'caching find result');
    this.#findCache.set(cacheKey, dtos);

    return dtos;
  }

  /**
   * Loads a batch of entities from database by ID.
   * Entities are returned in the same order as {@link ids}.
   * If an ID is not found, it is null in results.
   * @param {string[]|number[]} ids
   * @returns {Promise<(object|null)[]>}
   */
  async #batchLoad(ids) {
    this.#metrics.loadCacheMiss.inc(ids.length);

    logger.debug({ tableName: this.#tableName, count: ids.length }, 'loading from PG');
    const dtos = await knex
      .select(`${this.#tableName}.*`)
      .from(knex.raw(`unnest(?::${this.#idType}[]) with ordinality as ids(id, idx)`, [ids])) // eslint-disable-line knex/avoid-injections
      .leftJoin(this.#tableName, `${this.#tableName}.id`, 'ids.id')
      .orderBy('ids.idx');

    return dtos.map((dto) => (dto.id ? dto : null));
  }

  /**
   * Clears repository’s cache.
   * If {@link id} is undefined, all cache is cleared.
   * If {@link id} is given, cache is partially cleared.
   * @param {string|number|undefined} id
   */
  clearCache(id) {
    logger.debug({ tableName: this.#tableName, id }, 'triggering cache clear');

    if (id) {
      this.#dataloader.clear(id);
    } else {
      this.#dataloader.clearAll();
    }
    this.#findCache.clear();
  }
}
