import { NoCampaignParticipationForUserAndCampaign, NotFoundError } from '../../../../shared/domain/errors.js';
import { CampaignParticipationStatuses } from '../../../../shared/domain/models/index.js';

const getUserCampaignAssessmentResult = async function ({
  userId,
  campaignId,
  locale,
  badgeRepository,
  knowledgeElementRepository,
  badgeForCalculationRepository,
  participantResultRepository,
  stageAcquisitionCollectionRepository,
  campaignParticipationRepository,
}) {
  const { SHARED, TO_SHARE } = CampaignParticipationStatuses;
  const campaignParticipation = await campaignParticipationRepository.findOneByCampaignIdAndUserId({
    campaignId,
    userId,
  });

  if (![TO_SHARE, SHARED].includes(campaignParticipation.status)) {
    throw new NoCampaignParticipationForUserAndCampaign();
  }
  try {
    const [badges, knowledgeElements] = await Promise.all([
      badgeRepository.findByCampaignId(campaignId),
      knowledgeElementRepository.findUniqByUserIdForCampaignParticipation({
        userId,
        campaignParticipationId: campaignParticipation.id,
      }),
    ]);
    const stillValidBadgeIds = await _checkStillValidBadges(
      campaignId,
      knowledgeElements,
      badgeForCalculationRepository,
    );
    const badgeWithAcquisitionPercentage = await _getBadgeAcquisitionPercentage(
      campaignId,
      knowledgeElements,
      badgeForCalculationRepository,
    );

    const badgesWithValidity = badges.map((badge) => ({
      ...badge,
      isValid: stillValidBadgeIds.includes(badge.id),
      acquisitionPercentage: badgeWithAcquisitionPercentage.find(
        (badgeForCalculation) => badgeForCalculation.id === badge.id,
      ).acquisitionPercentage,
    }));

    const stageAcquisitionCollection = await stageAcquisitionCollectionRepository.getByCampaignParticipationId(
      campaignParticipation.id,
    );

    return await participantResultRepository.get({
      userId,
      campaignId,
      locale,
      badges: badgesWithValidity,
      stages: stageAcquisitionCollection.stages,
      reachedStage: {
        ...stageAcquisitionCollection.reachedStage,
        totalStage: stageAcquisitionCollection.totalNumberOfStages,
        reachedStage: stageAcquisitionCollection.reachedStageNumber,
      },
    });
  } catch (error) {
    if (error instanceof NotFoundError) throw new NoCampaignParticipationForUserAndCampaign();
    throw error;
  }
};

export { getUserCampaignAssessmentResult };

async function _checkStillValidBadges(campaignId, knowledgeElements, badgeForCalculationRepository) {
  const badgesForCalculation = await badgeForCalculationRepository.findByCampaignId({ campaignId });
  return badgesForCalculation.filter((badge) => badge.shouldBeObtained(knowledgeElements)).map(({ id }) => id);
}

async function _getBadgeAcquisitionPercentage(campaignId, knowledgeElements, badgeForCalculationRepository) {
  const badgesForCalculation = await badgeForCalculationRepository.findByCampaignId({ campaignId });
  return badgesForCalculation.map((badge) => ({
    id: badge.id,
    acquisitionPercentage: badge.getAcquisitionPercentage(knowledgeElements),
  }));
}
