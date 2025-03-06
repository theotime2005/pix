/**
 * @typedef {import ('../../../../lib/domain/usecases/index.js').OidcAuthenticationService} OidcAuthenticationService
 * @typedef {import ('../../../../lib/domain/usecases/index.js').AuthenticationSessionService} AuthenticationSessionService
 * @typedef {import ('../../../../lib/domain/usecases/index.js').AuthenticationMethodRepository} AuthenticationMethodRepository
 * @typedef {import ('../../../../lib/domain/usecases/index.js').UserRepository} UserRepository
 * @typedef {import ('../../../../lib/domain/usecases/index.js').UserLoginRepository} UserLoginRepository
 */

import { AuthenticationKeyExpired, DifferentExternalIdentifierError } from '../errors.js';
import { AuthenticationMethod } from '../models/AuthenticationMethod.js';

/**
 * @param {Object} params
 * @param {string} params.authenticationKey
 * @param {string} params.email
 * @param {string} params.identityProvider
 * @param {RequestedApplication} params.requestedApplication
 * @param {OidcAuthenticationService} params.oidcAuthenticationService
 * @param {lastUserApplicationConnectionsRepository} params.lastUserApplicationConnectionsRepository
 * @param {AuthenticationSessionService} params.authenticationSessionService
 * @param {AuthenticationMethodRepository} params.authenticationMethodRepository
 * @param {UserRepository} params.userRepository
 * @param {UserLoginRepository} params.userLoginRepository
 */
export const reconcileOidcUserForAdmin = async function ({
  authenticationKey,
  email,
  identityProvider,
  requestedApplication,
  oidcAuthenticationService,
  authenticationSessionService,
  authenticationMethodRepository,
  userRepository,
  userLoginRepository,
  lastUserApplicationConnectionsRepository,
}) {
  const sessionContentAndUserInfo = await authenticationSessionService.getByKey(authenticationKey);
  if (!sessionContentAndUserInfo) {
    throw new AuthenticationKeyExpired();
  }

  const foundUser = await userRepository.getByEmail(email);
  const userId = foundUser.id;

  await _assertExternalIdentifier({
    sessionContentAndUserInfo,
    identityProvider,
    userId,
    authenticationMethodRepository,
  });

  const { userInfo } = sessionContentAndUserInfo;
  const { externalIdentityId } = userInfo;

  const authenticationComplement = oidcAuthenticationService.createAuthenticationComplement({ userInfo });
  await authenticationMethodRepository.create({
    authenticationMethod: new AuthenticationMethod({
      identityProvider: oidcAuthenticationService.identityProvider,
      userId,
      externalIdentifier: externalIdentityId,
      authenticationComplement,
    }),
  });

  await _updateUserLastConnection({
    userId,
    requestedApplication,
    oidcAuthenticationService,
    authenticationMethodRepository,
    lastUserApplicationConnectionsRepository,
    userLoginRepository,
  });

  const accessToken = await oidcAuthenticationService.createAccessToken({
    userId,
    audience: requestedApplication.origin,
  });

  return accessToken;
};

async function _assertExternalIdentifier({
  sessionContentAndUserInfo,
  identityProvider,
  userId,
  authenticationMethodRepository,
}) {
  const oidcAuthenticationMethod = await authenticationMethodRepository.findOneByUserIdAndIdentityProvider({
    userId,
    identityProvider,
  });

  const isSameExternalIdentifier =
    oidcAuthenticationMethod?.externalIdentifier === sessionContentAndUserInfo.userInfo.externalIdentityId;

  if (oidcAuthenticationMethod && !isSameExternalIdentifier) {
    throw new DifferentExternalIdentifierError();
  }
}

async function _updateUserLastConnection({
  userId,
  requestedApplication,
  oidcAuthenticationService,
  authenticationMethodRepository,
  lastUserApplicationConnectionsRepository,
  userLoginRepository,
}) {
  await userLoginRepository.updateLastLoggedAt({ userId });
  await lastUserApplicationConnectionsRepository.upsert({
    userId,
    application: requestedApplication.applicationName,
    lastLoggedAt: new Date(),
  });
  await authenticationMethodRepository.updateLastLoggedAtByIdentityProvider({
    userId,
    identityProvider: oidcAuthenticationService.identityProvider,
  });
}
