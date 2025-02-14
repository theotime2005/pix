import boom from '@hapi/boom';
import lodash from 'lodash';

import { revokedUserAccessRepository } from '../../src/identity-access-management/infrastructure/repositories/revoked-user-access.repository.js';
import { getForwardedOrigin } from '../../src/identity-access-management/infrastructure/utils/network.js';
import { config } from '../../src/shared/config.js';
import { tokenService } from '../../src/shared/domain/services/token-service.js';

const { find } = lodash;

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
    schemaName: schemes.jwt.name,
    configuration: {
      key: config.authentication.secret,
      validate: (decodedAccessToken, options) =>
        validateUser(decodedAccessToken, { ...options, revokedUserAccessRepository }),
    },
  },

  jwtApplication: {
    name: 'jwt-application',
    schemaName: schemes.jwt.name,
    configuration: {
      key: config.authentication.secret,
      validate: validateClientApplication,
    },
  },

  jwtLivretScolaire: {
    name: 'jwt-livret-scolaire',
    schemaName: schemes.jwt.name,
    configuration: {
      key: config.jwtConfig.livretScolaire.secret,
      validate: validateClientApplication,
    },
  },

  jwtPoleEmploi: {
    name: 'jwt-pole-emploi',
    schemaName: schemes.jwt.name,
    configuration: {
      key: config.jwtConfig.poleEmploi.secret,
      validate: validateClientApplication,
    },
  },

  jwtPixData: {
    name: 'jwt-pix-data',
    schemaName: schemes.jwt.name,
    configuration: {
      key: config.jwtConfig.pixData.secret,
      validate: validateClientApplication,
    },
  },

  jwtParcoursup: {
    name: 'jwt-parcoursup',
    schemaName: schemes.jwt.name,
    configuration: {
      key: config.jwtConfig.parcoursup.secret,
      validate: validateClientApplication,
    },
  },
};

const authentication = {
  schemes,
  strategies,
  defaultStrategy: strategies.jwtUser.name,
};

async function validateUser(decodedAccessToken, { request, revokedUserAccessRepository }) {
  // Only tokens including user_id are User Access Tokens.
  // This is why applications Access Tokens are not subject to audience validation for now.
  const userId = decodedAccessToken.user_id;
  if (config.featureToggles.isUserTokenAudConfinementEnabled && userId) {
    const revokedUserAccess = await revokedUserAccessRepository.findByUserId(userId);
    if (revokedUserAccess.isAccessTokenRevoked(decodedAccessToken)) {
      return { isValid: false };
    }

    const audience = getForwardedOrigin(request.headers);
    if (decodedAccessToken.aud !== audience) {
      return { isValid: false };
    }
  }

  return { isValid: true, credentials: { userId: decodedAccessToken.user_id } };
}

async function validateClientApplication(decodedAccessToken) {
  const application = find(config.apimRegisterApplicationsCredentials, { clientId: decodedAccessToken.client_id });
  if (!application) {
    return { isValid: false, errorCode: 401 };
  }

  return {
    isValid: true,
    credentials: {
      client_id: decodedAccessToken.clientId,
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
