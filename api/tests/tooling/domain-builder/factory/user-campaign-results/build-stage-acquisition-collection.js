import { StageAcquisitionCollection } from '../../../../../src/shared/domain/models/user-campaign-results/StageAcquisitionCollection.js';
import { buildStage } from '../build-stage.js';
import { buildStageAcquisition } from '../build-stage-acquisition.js';

/**
 * @param {Stage[]} stages
 * @param {StageAcquisition[]} stageAcquisitions
 *
 * @returns {StageAcquisitionCollection}
 */
export const buildStageAcquisitionCollection = (stages = null, stageAcquisitions = null) =>
  new StageAcquisitionCollection(
    stages || [buildStage({ id: 1 })],
    stageAcquisitions || [buildStageAcquisition({ stageId: 1 })],
  );
