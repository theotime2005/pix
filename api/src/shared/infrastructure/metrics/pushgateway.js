import { Pushgateway } from 'prom-client';

import { config } from '../../config.js';
import { child } from '../utils/logger.js';
import { register } from './register.js';

const logger = child('metrics:pushgateway', { event: 'metrics' });

const pushgateway = new Pushgateway(config.metrics.pushgateway.url, {}, register);

async function pushMetrics() {
  logger.debug('pushing metrics');
  await pushgateway.pushAdd({ jobName: config.infra.appName ?? 'pix-api-localhost' });
}

let pushMetricsInterval;

export function startPushingMetrics() {
  if (pushMetricsInterval !== undefined) return;
  pushMetricsInterval = setInterval(() => {
    pushMetrics().catch((err) => logger.error({ err }, 'error while pushing metrics'));
  }, config.metrics.pushgateway.pushInterval);
}

export async function stopPushingMetrics() {
  if (pushMetricsInterval === undefined) return;
  clearInterval(pushMetricsInterval);
  await pushMetrics();
}
