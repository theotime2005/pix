import { Gauge as PromClientGauge } from 'prom-client';

import { config } from '../../config.js';
import { register } from './register.js';

export class Gauge extends PromClientGauge {
  /**
   * @param {Omit<ConstructorParameters<typeof PromClientGauge>[0], "registers">} configuration
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
