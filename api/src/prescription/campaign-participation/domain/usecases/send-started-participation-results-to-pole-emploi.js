import * as httpErrorsHelper from '../../../../../lib/infrastructure/http/errors-helper.js';
import { httpAgent } from '../../../../../lib/infrastructure/http/http-agent.js';
import { logger } from '../../../../shared/infrastructure/utils/logger.js';
import { PoleEmploiPayload } from '../../infrastructure/externals/pole-emploi/PoleEmploiPayload.js';
import { PoleEmploiSending } from '../models/PoleEmploiSending.js';

const sendStartedParticipationResultsToPoleEmploi = async ({
  campaignParticipationId,
  authenticationMethodRepository,
  campaignParticipationRepository,
  campaignRepository,
  organizationRepository,
  poleEmploiNotifier,
  poleEmploiSendingRepository,
  targetProfileRepository,
  userRepository,
  notifierDependencies = {
    httpAgent,
    httpErrorsHelper,
    logger,
  },
}) => {
  const participation = await campaignParticipationRepository.get(campaignParticipationId);
  const campaign = await campaignRepository.get(participation.campaignId);
  const organization = await organizationRepository.get(campaign.organizationId);

  if (campaign.isAssessment() && organization.isPoleEmploi) {
    const user = await userRepository.get(participation.userId);
    const targetProfile = await targetProfileRepository.get(campaign.targetProfileId);
    const payload = PoleEmploiPayload.buildForParticipationStarted({
      user,
      campaign,
      targetProfile,
      participation,
    });

    const response = await poleEmploiNotifier.notify(user.id, payload, {
      authenticationMethodRepository: authenticationMethodRepository,
      ...notifierDependencies,
    });

    const poleEmploiSending = PoleEmploiSending.buildForParticipationStarted({
      campaignParticipationId,
      payload: payload.toString(),
      isSuccessful: response.isSuccessful,
      responseCode: response.code,
    });

    await poleEmploiSendingRepository.create({ poleEmploiSending });
  }
};

export { sendStartedParticipationResultsToPoleEmploi };
