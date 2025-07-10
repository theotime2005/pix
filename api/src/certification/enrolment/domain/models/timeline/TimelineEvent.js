// @ts-check

import Joi from 'joi';

import { EntityValidationError } from '../../../../../shared/domain/errors.js';

export class TimelineEvent {
  static #schema = Joi.object({
    code: Joi.string().required(),
    when: Joi.date().required(),
  });

  /**
   * @param {Object} props
   * @param {string} props.code
   * @param {Date} [props.when]
   */
  constructor({ code, when = new Date() }) {
    this.code = code;
    this.when = when;
    this.#validate();
  }

  #validate() {
    const { error } = TimelineEvent.#schema.validate(this, { allowUnknown: false });
    if (error) {
      throw EntityValidationError.fromJoiErrors(error.details);
    }
  }
}
