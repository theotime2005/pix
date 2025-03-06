import { NON_OIDC_IDENTITY_PROVIDERS } from '../../../src/identity-access-management/domain/constants/identity-providers.js';
import {
  MissingOrInvalidCredentialsError,
  PasswordNotMatching,
  UserShouldChangePasswordError,
} from '../../../src/identity-access-management/domain/errors.js';
import { AuthenticationMethod } from '../../../src/identity-access-management/domain/models/AuthenticationMethod.js';
import {
  UnexpectedUserAccountError,
  UserAlreadyExistsWithAuthenticationMethodError,
  UserNotFoundError,
} from '../../../src/shared/domain/errors.js';

/**
 * typedef { function } authenticateExternalUser
 * @param {Object} params
 * @param {string} params.username
 * @param {string} params.password
 * @param {string} params.externalUserToken
 * @param {number} params.expectedUserId
 * @param {RequestedApplication} params.requestedApplication,
 * @param {TokenService} params.tokenService
 * @param {PixAuthenticationService} params.pixAuthenticationService
 * @param {ObfuscationService} params.obfuscationService
 * @param {AuthenticationMethodRepository} params.authenticationMethodRepository
 * @param {UserRepository} params.userRepository
 * @param {UserLoginRepository} params.userLoginRepository
 * @param {LastUserApplicationConnectionsRepository} params.lastUserApplicationConnectionsRepository,
 * @returns {Promise<*>}
 */
async function authenticateExternalUser({
  username,
  password,
  externalUserToken,
  expectedUserId,
  requestedApplication,
  tokenService,
  pixAuthenticationService,
  obfuscationService,
  authenticationMethodRepository,
  userRepository,
  userLoginRepository,
  lastUserApplicationConnectionsRepository,
}) {
  try {
    const userFromCredentials = await pixAuthenticationService.getUserByUsernameAndPassword({
      username,
      password,
      userRepository,
    });

    if (userFromCredentials.id !== expectedUserId) {
      const expectedUser = await userRepository.getForObfuscation(expectedUserId);
      const authenticationMethod = await obfuscationService.getUserAuthenticationMethodWithObfuscation(expectedUser);

      throw new UnexpectedUserAccountError({
        message: undefined,
        meta: { value: authenticationMethod.value },
      });
    }

    await _addGarAuthenticationMethod({
      userId: userFromCredentials.id,
      externalUserToken,
      tokenService,
      authenticationMethodRepository,
      userRepository,
    });

    if (userFromCredentials.shouldChangePassword) {
      const passwordResetToken = tokenService.createPasswordResetToken(userFromCredentials.id);
      throw new UserShouldChangePasswordError(undefined, passwordResetToken);
    }

    const token = tokenService.createAccessTokenForSaml({
      userId: userFromCredentials.id,
      audience: requestedApplication.origin,
    });

    await userLoginRepository.updateLastLoggedAt({ userId: userFromCredentials.id });
    await lastUserApplicationConnectionsRepository.upsert({
      userId: userFromCredentials.id,
      application: requestedApplication.applicationName,
      lastLoggedAt: new Date(),
    });
    await authenticationMethodRepository.updateLastLoggedAtByIdentityProvider({
      userId: userFromCredentials.id,
      identityProvider: NON_OIDC_IDENTITY_PROVIDERS.PIX.code,
    });
    return token;
  } catch (error) {
    if (error instanceof UserNotFoundError || error instanceof PasswordNotMatching) {
      throw new MissingOrInvalidCredentialsError();
    } else {
      throw error;
    }
  }
}

async function _addGarAuthenticationMethod({
  userId,
  externalUserToken,
  tokenService,
  authenticationMethodRepository,
  userRepository,
}) {
  const { samlId, firstName, lastName } = await tokenService.extractExternalUserFromIdToken(externalUserToken);
  await _checkIfSamlIdIsNotReconciledWithAnotherUser({ samlId, userId, userRepository });

  const garAuthenticationMethod = new AuthenticationMethod({
    identityProvider: NON_OIDC_IDENTITY_PROVIDERS.GAR.code,
    externalIdentifier: samlId,
    userId,
    authenticationComplement: new AuthenticationMethod.GARAuthenticationComplement({
      firstName,
      lastName,
    }),
  });
  await authenticationMethodRepository.create({ authenticationMethod: garAuthenticationMethod });
}

const _checkIfSamlIdIsNotReconciledWithAnotherUser = async ({ samlId, userId, userRepository }) => {
  const userFromCredentialsBySamlId = await userRepository.getBySamlId(samlId);
  if (userFromCredentialsBySamlId && userFromCredentialsBySamlId.id !== userId) {
    throw new UserAlreadyExistsWithAuthenticationMethodError();
  }
};

export { authenticateExternalUser };
