import { usecases as profileUsecases } from '../../../profile/domain/usecases/index.js';
import { usecases as questUsecases } from '../../../quest/domain/usecases/index.js';
import { DomainTransaction } from '../../../shared/domain/DomainTransaction.js';
import * as requestResponseUtils from '../../../shared/infrastructure/utils/request-response-utils.js';
import { usecases } from '../domain/usecases/index.js';
import * as campaignParticipationSerializer from '../infrastructure/serializers/jsonapi/campaign-participation-serializer.js';
import * as sharedProfileForCampaignSerializer from '../infrastructure/serializers/jsonapi/shared-profile-for-campaign-serializer.js';

const save = async function (request, h, dependencies = { campaignParticipationSerializer }) {
  const userId = request.auth.credentials.userId;
  const campaignParticipation = await dependencies.campaignParticipationSerializer.deserialize(request.payload);

  const { campaignParticipation: campaignParticipationCreated } = await DomainTransaction.execute(() => {
    return usecases.startCampaignParticipation({ campaignParticipation, userId });
  });

  return h.response(dependencies.campaignParticipationSerializer.serialize(campaignParticipationCreated)).created();
};

const shareCampaignResult = async function (request, _, dependencies = { profileUsecases, questUsecases }) {
  const userId = request.auth.credentials.userId;
  const campaignParticipationId = request.params.campaignParticipationId;

  return DomainTransaction.execute(async () => {
    await usecases.shareCampaignResult({
      userId,
      campaignParticipationId,
    });

    const questResults = await dependencies.questUsecases.getQuestResultsForCampaignParticipation({
      userId,
      campaignParticipationId,
    });

    const lastResult = questResults.at(-1);
    const profileRewardId = lastResult?.profileRewardId;

    if (profileRewardId) {
      await dependencies.profileUsecases.shareProfileReward({
        userId,
        profileRewardId,
        campaignParticipationId,
      });
    }

    return null;
  });
};

const beginImprovement = async function (request) {
  const userId = request.auth.credentials.userId;
  const campaignParticipationId = request.params.campaignParticipationId;

  return DomainTransaction.execute(async () => {
    await usecases.beginCampaignParticipationImprovement({
      campaignParticipationId,
      userId,
    });
    return null;
  });
};

const getSharedCampaignParticipationProfile = async function (
  request,
  h,
  dependencies = {
    sharedProfileForCampaignSerializer,
    requestResponseUtils,
  },
) {
  const authenticatedUserId = request.auth.credentials.userId;
  const campaignId = request.params.campaignId;
  const locale = dependencies.requestResponseUtils.extractLocaleFromRequest(request);

  const sharedProfileForCampaign = await usecases.getSharedCampaignParticipationProfile({
    userId: authenticatedUserId,
    campaignId,
    locale,
  });

  return dependencies.sharedProfileForCampaignSerializer.serialize(sharedProfileForCampaign);
};

const learnerParticipationController = {
  save,
  shareCampaignResult,
  beginImprovement,
  getSharedCampaignParticipationProfile,
};

export { learnerParticipationController };
