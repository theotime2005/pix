import { StageAcquisitionCollection } from '../../../shared/domain/models/user-campaign-results/StageAcquisitionCollection.js';
import * as stageAcquisitionRepository from './stage-acquisition-repository.js';
import * as stageRepository from './stage-repository.js';

/**
 * @param {number} campaignParticipationId
 *
 * @returns {Promise<StageAcquisitionCollection>}
 */
const getByCampaignParticipationId = async (campaignParticipationId) => {
  const stages = await stageRepository.getByCampaignParticipationId(campaignParticipationId);
  const stageAcquisitions = await stageAcquisitionRepository.getByCampaignParticipation(campaignParticipationId);

  return new StageAcquisitionCollection(stages, stageAcquisitions);
};

export { getByCampaignParticipationId };
