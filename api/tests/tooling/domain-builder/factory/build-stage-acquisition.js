import { StageAcquisition } from '../../../../src/evaluation/domain/models/StageAcquisition.js';

const buildStageAcquisition = function ({ id = 1, stageId = 123, campaignParticipationId = 5000 } = {}) {
  return new StageAcquisition({
    id,
    stageId,
    campaignParticipationId,
  });
};

export { buildStageAcquisition };
