import boom from '@hapi/boom';

import { revokedUserAccessRepository } from '../../src/identity-access-management/infrastructure/repositories/revoked-user-access.repository.js';
import { RequestedApplication } from '../../src/identity-access-management/infrastructure/utils/network.js';
import { config } from '../../src/shared/config.js';
import { tokenService } from '../../src/shared/domain/services/token-service.js';
import { monitoringTools } from '../../src/shared/infrastructure/monitoring-tools.js';

const schemes = {
  jwt: {
    name: 'jwt-scheme',
    scheme(_, strategyConfiguration) {
      return {
        authenticate: authenticateJWT(strategyConfiguration),
      };
    },
  },
};

const strategies = {
  jwtUser: {
    name: 'jwt-user',
    schemeName: schemes.jwt.name,
    configuration: {
      key: config.authentication.secret,
      validate: (decodedAccessToken, options) =>
        validateUser(decodedAccessToken, { ...options, revokedUserAccessRepository }),
    },
  },

  jwtApplication: {
    name: 'jwt-application',
    schemeName: schemes.jwt.name,
    configuration: {
      key: config.authentication.secret,
      validate: validateClientApplication,
    },
  },
};

const authentication = {
  schemes,
  strategies,
};

async function validateUser(decodedAccessToken, { request, revokedUserAccessRepository }) {
  const userId = decodedAccessToken.user_id;
  if (!userId) {
    return { isValid: false };
  }

  const revokedUserAccess = await revokedUserAccessRepository.findByUserId(userId);
  if (revokedUserAccess.isAccessTokenRevoked(decodedAccessToken)) {
    monitoringTools.logWarnWithCorrelationIds({
      message: 'Revoked user AccessToken usage',
      decodedAccessToken,
    });

    return { isValid: false };
  }

    const audience = RequestedApplication.fromHeaders(request.headers).origin;
    if (decodedAccessToken.aud !== audience) {
      monitoringTools.logWarnWithCorrelationIds({
        message: 'User AccessToken audience mismatch',
        audience,
        decodedAccessToken,
      });

    return { isValid: false };
  }

  return { isValid: true, credentials: { userId: decodedAccessToken.user_id } };
}

export async function validateClientApplication(decodedAccessToken) {
  if (!decodedAccessToken.client_id) {
    return { isValid: false };
  }

  return {
    isValid: true,
    credentials: {
      client_id: decodedAccessToken.client_id,
      scope: decodedAccessToken.scope,
      source: decodedAccessToken.source,
    },
  };
}

function authenticateJWT({ key, validate }) {
  return async (request, h) => {
    const authorizationHeader = request.headers.authorization;
    if (!authorizationHeader) {
      return boom.unauthorized(null, 'jwt');
    }

    const accessToken = tokenService.extractTokenFromAuthChain(authorizationHeader);
    if (!accessToken) {
      return boom.unauthorized();
    }

    const decodedAccessToken = tokenService.getDecodedToken(accessToken, key);
    if (!decodedAccessToken) {
      return boom.unauthorized();
    }

    const { isValid, credentials, errorCode } = await validate(decodedAccessToken, { request, h });
    if (isValid) {
      return h.authenticated({ credentials });
    }

    if (errorCode === 403) {
      return boom.forbidden();
    }

    return boom.unauthorized();
  };
}

export { authentication, validateUser };
