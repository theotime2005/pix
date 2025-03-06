import Boom from '@hapi/boom';

import { databaseConnections } from '../../../../db/database-connections.js';
import packageJSON from '../../../../package.json' with { type: 'json' };
import { RequestedApplication } from '../../../identity-access-management/infrastructure/utils/network.js';
import { config } from '../../config.js';
import { redisMonitor } from '../../infrastructure/utils/redis-monitor.js';

const get = function (request) {
  return {
    name: packageJSON.name,
    version: packageJSON.version,
    description: packageJSON.description,
    environment: config.environment,

    'container-version': process.env.CONTAINER_VERSION,

    'container-app-name': process.env.APP,
    'current-lang': request.i18n.getLocale(),
  };
};

const checkDbStatus = async function () {
  try {
    await databaseConnections.checkStatuses();
    return { message: 'Connection to databases ok' };
  } catch (error) {
    throw Boom.serverUnavailable(`Connection to databases failed: ${error.message}`);
  }
};

const checkRedisStatus = async function () {
  try {
    await redisMonitor.ping();
    return { message: 'Connection to Redis ok' };
  } catch {
    throw Boom.serverUnavailable('Connection to Redis failed');
  }
};

const checkForwardedOriginStatus = async function (request, h) {
  let forwardedOrigin;
  try {
    // RequestedApplication.fromHeaders throws ForwardedOriginError which maps to a HTTP status code 400,
    // but for monitoring purpose we want this error to produce a 500.
    forwardedOrigin = RequestedApplication.fromHeaders(request.headers).origin;
  } catch {
    return h.response('Obtaining Forwarded Origin failed').code(500);
  }

  return h.response(forwardedOrigin).code(200);
};

const healthcheckController = { get, checkDbStatus, checkRedisStatus, checkForwardedOriginStatus };

export { healthcheckController };
