import { Histogram as PromClientHistogram } from 'prom-client';

import { config } from '../../config.js';
import { register } from './register.js';

export class Histogram extends PromClientHistogram {
  /**
   * @param {Omit<ConstructorParameters<typeof PromClientHistogram>[0], "registers">} configuration
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
