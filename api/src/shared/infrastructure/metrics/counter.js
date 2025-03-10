import { Counter as PromClientCounter } from 'prom-client';

import { config } from '../../config.js';
import { register } from './register.js';

export class Counter extends PromClientCounter {
  /**
   * @param {Omit<ConstructorParameters<typeof PromClientCounter>[0], "registers">} configuration
   */
  constructor({ name, labelNames = [], ...configuration }) {
    super({
      ...configuration,
      name: `${config.metrics.prefix}_${name}`,
      labelNames: ['instance', ...labelNames],
      registers: [register],
    });
  }
}
