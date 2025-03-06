import { randomUUID } from 'node:crypto';

import { RequestedApplication } from '../../../src/identity-access-management/infrastructure/utils/network.js';
import { usecases } from '../../domain/usecases/index.js';

const authenticateExternalUser = async function (request, h) {
  const {
    username,
    password,
    'external-user-token': externalUserToken,
    'expected-user-id': expectedUserId,
  } = request.payload.data.attributes;

  const requestedApplication = RequestedApplication.fromHeaders(request.headers);

  const accessToken = await usecases.authenticateExternalUser({
    username,
    password,
    externalUserToken,
    expectedUserId,
    requestedApplication,
  });

  const response = {
    data: {
      attributes: {
        'access-token': accessToken,
      },
      id: randomUUID(),
      type: 'external-user-authentication-requests',
    },
  };
  return h.response(response).code(200);
};

const authenticationController = {
  authenticateExternalUser,
};

export { authenticationController };
