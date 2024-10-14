import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

import packageJSON from '../../../../package.json' with { type: 'json' };
import { config } from '../../config.js';

// Ensure to call this before requiring any other modules!
Sentry.init({
  dsn: config.sentry.dsn,
  environment: config.sentry.environment,
  maxBreadcrumbs: config.sentry.maxBreadcrumbs,
  debug: config.sentry.debug,
  maxValueLength: config.sentry.maxValueLength,
  release: `v${packageJSON.version}`,
  scope: {
    tags: [{ name: 'source', value: 'api' }],
  },
  integrations: [
    // Add our Profiling integration
    nodeProfilingIntegration(),
  ],

  // Add Tracing by setting tracesSampleRate
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // Set sampling rate for profiling
  // This is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});
