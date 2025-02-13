import { config } from '../../../src/shared/config.js';
import {
  ApplicationScopeNotAllowedError,
  ApplicationWithInvalidClientIdError,
  ApplicationWithInvalidClientSecretError,
} from '../../../src/shared/domain/errors.js';

const { authentication } = config;

export async function authenticateApplication({
  clientId,
  clientSecret,
  scope,
  tokenService,
  clientApplicationRepository,
  cryptoService,
}) {
  const application = await clientApplicationRepository.findByClientId(clientId);
  _checkApplication(application, clientId);
  await _checkClientSecret(application, clientSecret, cryptoService);
  _checkAppScope(application, scope);

  return tokenService.createAccessTokenFromApplication(
    clientId,
    application.name,
    scope,
    authentication.secret,
    authentication.accessTokenLifespanMs,
  );
}

function _checkApplication(application) {
  if (!application) {
    throw new ApplicationWithInvalidClientIdError('The client ID is invalid.');
  }
}

async function _checkClientSecret(application, clientSecret, cryptoService) {
  try {
    await cryptoService.checkPassword({ password: clientSecret, passwordHash: application.clientSecret });
  } catch {
    throw new ApplicationWithInvalidClientSecretError('The client secret is invalid.');
  }
}

function _checkAppScope(application, scope) {
  if (!application.scopes.includes(scope)) {
    throw new ApplicationScopeNotAllowedError('The scope is invalid.');
  }
}
