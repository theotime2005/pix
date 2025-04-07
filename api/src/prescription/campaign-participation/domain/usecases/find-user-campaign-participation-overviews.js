const findUserCampaignParticipationOverviews = async function ({
  userId,
  states,
  page,
  stageAcquisitionCollectionRepository,
  campaignParticipationOverviewRepository,
}) {
  const concatenatedStates = states ? [].concat(states) : undefined;

  const { campaignParticipationOverviews, pagination } =
    await campaignParticipationOverviewRepository.findByUserIdWithFilters({
      userId,
      states: concatenatedStates,
      page,
    });

  const campaignParticipationOverviewsWithStages = await Promise.all(
    campaignParticipationOverviews.map(async (campaignParticipationOverview) => {
      const stageAcquisitionCollection = await stageAcquisitionCollectionRepository.getByCampaignParticipationId(
        campaignParticipationOverview.id,
      );

      campaignParticipationOverview.totalStagesCount = stageAcquisitionCollection.totalNumberOfStages;
      campaignParticipationOverview.validatedStagesCount = stageAcquisitionCollection.reachedStageNumber;

      return campaignParticipationOverview;
    }),
  );

  return { campaignParticipationOverviews: campaignParticipationOverviewsWithStages, pagination };
};

export { findUserCampaignParticipationOverviews };
