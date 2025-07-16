import { DomainTransaction } from '../../../shared/domain/DomainTransaction.js';
import { LtiPlatformRegistration } from '../../domain/models/LtiPlatformRegistration.js';

export const ltiPlatformRegistrationRepository = {
  async findByClientId(clientId) {
    const trx = DomainTransaction.getConnection();

    const ltiPlatformRegistrationDTO = await trx
      .select('*')
      .from('lti_platform_registrations')
      .where('clientId', clientId)
      .first();

    if (!ltiPlatformRegistrationDTO) {
      return null;
    }

    return new LtiPlatformRegistration(ltiPlatformRegistrationDTO);
  },

  async listActivePublicKeys() {
    const trx = DomainTransaction.getConnection();

    return trx.select('publicKey').from('lti_platform_registrations').where('status', 'active').pluck('publicKey');
  },

  async save({
    clientId,
    platformOrigin,
    status,
    toolConfig,
    encryptedPrivateKey,
    publicKey,
    platformOpenIdConfigUrl,
  }) {
    const trx = DomainTransaction.getConnection();

    return trx('lti_platform_registrations').insert({
      clientId,
      platformOrigin,
      status,
      toolConfig,
      encryptedPrivateKey,
      publicKey,
      platformOpenIdConfigUrl,
    });
  },
};
