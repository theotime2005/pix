import lodash from 'lodash';

const { has } = lodash;

import { AlreadyRegisteredEmailError } from '../../../../src/shared/domain/errors.js';
import { AuthenticationMethod } from '../models/AuthenticationMethod.js';
import { NON_OIDC_IDENTITY_PROVIDERS } from '../constants/identity-providers.js';


const deanonymiseUserAfterAnonymousFlow = async function ({
  userId,
  userDetailsToUpdate,
  authenticationMethodRepository,
  userRepository,
  cryptoService,
  password,
}) {
  // récupérer id du token dans redis = id du token dans la data.attributes
//vérifier que l'utilisateur est bien anonyme (aller voir le reset de mot de passe)
  const { email, firstName, lastName, cgu } = userDetailsToUpdate;

  await _checkEmailIsAvailable({ userId, email, userRepository });

  const currentUser = await userRepository.get(userId);
  console.log({currentUser});

  await userRepository.update({ id: userId, isAnonymous: false });
  //il faudra une méthode spécifique pour ce cas, autre que "updateDetailsForAdministration
  //traiter la mise à jour des CGU proprement
  await userRepository.updateUserDetailsForAdministration({ id: userId, userAttributes: { email, firstName, lastName, cgu : true } });
  userDetailsToUpdate.mustValidateTermsOfService = false;

  const hashedPassword = await cryptoService.hashPassword(password);

  const authenticationMethodFromPix = new AuthenticationMethod({
    userId,
    identityProvider: NON_OIDC_IDENTITY_PROVIDERS.PIX.code,
    authenticationComplement: new AuthenticationMethod.PixAuthenticationComplement({
      password: hashedPassword,
      shouldChangePassword: false,
    }),
  });
  await authenticationMethodRepository.create({
    authenticationMethod: authenticationMethodFromPix,
  });
  const updatedUser = await userRepository.getFullById(userId);
  console.log({updatedUser});
  return updatedUser;
};

async function _checkEmailIsAvailable({ userId, email, userRepository }) {
  const foundUsersWithEmailAlreadyUsed = email && (await userRepository.findAnotherUserByEmail(userId, email));
  const isEmailAlreadyUsed = has(foundUsersWithEmailAlreadyUsed, '[0].email');

  if (isEmailAlreadyUsed) {
    throw new AlreadyRegisteredEmailError();
  }
}



export { deanonymiseUserAfterAnonymousFlow };
