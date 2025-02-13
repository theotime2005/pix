import boom from '@hapi/boom';
import lodash from 'lodash';

import { revokedUserAccessRepository } from '../../src/identity-access-management/infrastructure/repositories/revoked-user-access.repository.js';
import { getForwardedOrigin } from '../../src/identity-access-management/infrastructure/utils/network.js';
import { config } from '../../src/shared/config.js';
import { tokenService } from '../../src/shared/domain/services/token-service.js';

const { find } = lodash;

const authentication = {
  schemeName: 'jwt-scheme',

  scheme(_, { key, validate }) {
    return { authenticate: (request, h) => _checkIsAuthenticated(request, h, { key, validate }) };
  },

  strategies: [
    {
      name: 'jwt-user',
      configuration: {
        key: config.authentication.secret,
        validate: validateUser,
      },
    },
    {
      name: 'jwt-livret-scolaire',
      configuration: {
        key: config.jwtConfig.livretScolaire.secret,
        validate: validateClientApplication,
      },
    },
    {
      name: 'jwt-pole-emploi',
      configuration: {
        key: config.jwtConfig.poleEmploi.secret,
        validate: validateClientApplication,
      },
    },
    {
      name: 'jwt-pix-data',
      configuration: {
        key: config.jwtConfig.pixData.secret,
        validate: validateClientApplication,
      },
    },
    {
      name: 'jwt-parcoursup',
      configuration: {
        key: config.jwtConfig.parcoursup.secret,
        validate: validateClientApplication,
      },
    },
  ],

  defaultStrategy: 'jwt-user',
};

function validateUser(decoded) {
  return { isValid: true, credentials: { userId: decoded.user_id } };
}

function validateClientApplication(decoded) {
  const application = find(config.apimRegisterApplicationsCredentials, { clientId: decoded.client_id });
  if (!application) {
    return { isValid: false, errorCode: 401 };
  }

  return { isValid: true, credentials: { client_id: decoded.clientId, scope: decoded.scope, source: decoded.source } };
}

async function _checkIsAuthenticated(request, h, { key, validate }) {
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

  // Only tokens including user_id are User Access Tokens.
  // This is why applications Access Tokens are not subject to audience validation for now.
  const userId = decodedAccessToken.user_id;
  if (config.featureToggles.isUserTokenAudConfinementEnabled && userId) {
    const revokedUserAccess = await revokedUserAccessRepository.findByUserId(userId);
    if (revokedUserAccess.isAccessTokenRevoked(decodedAccessToken)) {
      return boom.unauthorized();
    }

    const audience = getForwardedOrigin(request.headers);
    if (decodedAccessToken.aud !== audience) {
      return boom.unauthorized();
    }
  }

  const { isValid, credentials, errorCode } = validate(decodedAccessToken, request, h);
  if (isValid) {
    return h.authenticated({ credentials });
  }

  if (errorCode === 403) {
    return boom.forbidden();
  }

  return boom.unauthorized();
}

export { authentication };
