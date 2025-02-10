import Joi from 'joi';
import PgBoss from 'pg-boss';

import { config } from '../../../config.js';
import { EntityValidationError } from '../../../domain/errors.js';

const monitorStateIntervalSeconds = config.pgBoss.monitorStateIntervalSeconds;
const pgBoss = new PgBoss({
  connectionString: config.pgBoss.databaseUrl,
  max: config.pgBoss.connexionPoolMaxSize,
  ...(monitorStateIntervalSeconds ? { monitorStateIntervalSeconds } : {}),
  archiveFailedAfterSeconds: config.pgBoss.archiveFailedAfterSeconds,
});
await pgBoss.start();

export class JobRepository {
  #schema = Joi.object({
    expireIn: Joi.string()
      .required()
      .valid(...Object.values(JobExpireIn))
      .messages({
        'any.only': `"expireIn" accept only JobExpireIn value such as ${Object.keys(JobExpireIn).join(', ')}`,
      }),
    priority: Joi.string()
      .required()
      .valid(...Object.values(JobPriority))
      .messages({
        'any.only': `"priority" accept only JobPriority value such as ${Object.keys(JobPriority).join(', ')}`,
      }),
    retry: Joi.object()
      .required()
      .valid(...Object.values(JobRetry))
      .messages({
        'any.only': `"retry" accept only JobRetry value such as ${Object.keys(JobRetry).join(', ')}`,
      }),
  });

  /**
   * @param {Object} config
   * @param {string} config.name Job name
   * @param {valueOf<JobPriority>} config.priority Job prority
   * @param {valueOf<JobRetry>} config.retry Job retry strategy
   * @param {valueOf<JobExpireIn>} config.expireIn Job retention duration
   */
  constructor(config) {
    this.name = config.name;

    this.retry = config.retry || JobRetry.NO_RETRY;

    this.expireIn = config.expireIn || JobExpireIn.DEFAULT;
    this.priority = config.priority || JobPriority.DEFAULT;

    this.#validate();
  }

  static get pgBoss() {
    return pgBoss;
  }

  #buildPayload(data) {
    return {
      name: this.name,
      data,
      retryLimit: this.retry.retryLimit,
      retryDelay: this.retry.retryDelay,
      retryBackoff: this.retry.retryBackoff,
      expireInSeconds: this.expireIn,
      onComplete: true,
      priority: this.priority,
    };
  }

  async #send(jobs) {
    await JobRepository.pgBoss.insert(jobs);
    return { rowCount: jobs.length };
  }

  async performAsync(...datas) {
    const jobs = datas.map((payload) => {
      return this.#buildPayload(payload);
    });

    return this.#send(jobs);
  }

  #validate() {
    const { error } = this.#schema.validate(this, { allowUnknown: true });
    if (error) {
      throw EntityValidationError.fromJoiErrors(error.details);
    }
  }
}

/**
 * Job priority. Higher numbers have, um, higher priority
 * @see https://github.com/timgit/pg-boss/blob/9.0.3/docs/readme.md#insertjobs
 * @readonly
 * @enum {number}
 */
export const JobPriority = Object.freeze({
  DEFAULT: 0,
  HIGH: 1,
});

/**
 * Job retry. define few config to retry job when failed
 * @see https://github.com/timgit/pg-boss/blob/9.0.3/docs/readme.md#insertjobs
 * @readonly
 * @enum {Object}
 */
export const JobRetry = Object.freeze({
  NO_RETRY: {
    retryLimit: 0,
    retryDelay: 0,
    retryBackoff: false,
  },
  FEW_RETRY: {
    retryLimit: 2,
    retryDelay: 30,
    retryBackoff: true,
  },
  STANDARD_RETRY: {
    retryLimit: 10,
    retryDelay: 30,
    retryBackoff: true,
  },
  HIGH_RETRY: {
    retryLimit: 10,
    retryDelay: 30,
    retryBackoff: false,
  },
});

/**
 * Job expireIn. define few config to set expireInSeconds field
 * @see https://github.com/timgit/pg-boss/blob/9.0.3/docs/readme.md#insertjobs
 * @readonly
 * @enum {string}
 */
export const JobExpireIn = Object.freeze({
  DEFAULT: 15 * 60,
  HIGH: 30 * 60,
});
