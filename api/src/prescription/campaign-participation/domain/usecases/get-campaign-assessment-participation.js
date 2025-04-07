import { withTransaction } from '../../../../shared/domain/DomainTransaction.js';
import { UserNotAuthorizedToAccessEntityError } from '../../../../shared/domain/errors.js';

const getCampaignAssessmentParticipation = withTransaction(async function ({
  userId,
  campaignId,
  campaignParticipationId,
  campaignRepository,
  campaignAssessmentParticipationRepository,
  badgeAcquisitionRepository,
  stageAcquisitionCollectionRepository,
}) {
  // TODO : throw when campaignId not matching campaignParticipationId ? may be move this to pre handler
  if (!(await campaignRepository.checkIfUserOrganizationHasAccessToCampaign(campaignId, userId))) {
    throw new UserNotAuthorizedToAccessEntityError('User does not belong to the organization that owns the campaign');
  }

  const campaign = await campaignRepository.get(campaignId);
  const campaignAssessmentParticipation =
    await campaignAssessmentParticipationRepository.getByCampaignIdAndCampaignParticipationId({
      campaignId,
      campaignParticipationId,
      shouldBuildProgression: campaign.isTypeAssessment,
    });

  // TODO : avoid get data if participation is not shared badges/stages ?
  const acquiredBadgesByCampaignParticipations =
    await badgeAcquisitionRepository.getAcquiredBadgesByCampaignParticipations({
      campaignParticipationsIds: [campaignParticipationId],
    });

  const badges = acquiredBadgesByCampaignParticipations[campaignAssessmentParticipation.campaignParticipationId];
  campaignAssessmentParticipation.setBadges(badges);

  const stageAcquisitionCollection =
    await stageAcquisitionCollectionRepository.getByCampaignParticipationId(campaignParticipationId);

  campaignAssessmentParticipation.setStageInfo(stageAcquisitionCollection.reachedStage);

  return campaignAssessmentParticipation;
});

export { getCampaignAssessmentParticipation };
