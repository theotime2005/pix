import { getByCampaignParticipationId } from '../../../../../src/evaluation/infrastructure/repositories/stage-acquisition-collection-repository.js';
import { StageAcquisitionCollection } from '../../../../../src/shared/domain/models/user-campaign-results/StageAcquisitionCollection.js';
import { databaseBuilder, expect } from '../../../../test-helper.js';

describe('Evaluation | Integration | Repository | Stage Acquisition Collection', function () {
  describe(getByCampaignParticipationId.name, function () {
    let campaignParticipation;
    let result;

    beforeEach(async function () {
      // given
      const targetProfileId = databaseBuilder.factory.buildTargetProfile().id;
      const campaignId = databaseBuilder.factory.buildCampaign({ targetProfileId }).id;
      campaignParticipation = databaseBuilder.factory.buildCampaignParticipation({ campaignId });

      databaseBuilder.factory.buildStage({ targetProfileId, id: 1, level: 1, isFirstSkill: false });
      databaseBuilder.factory.buildStage({ targetProfileId, id: 2, level: 4, isFirstSkill: false });
      databaseBuilder.factory.buildStage({ targetProfileId, id: 3, level: 3, isFirstSkill: false });
      databaseBuilder.factory.buildStage({ targetProfileId, id: 4, level: null, isFirstSkill: true });
      databaseBuilder.factory.buildStage({ targetProfileId, id: 5, level: 0, isFirstSkill: false });
      databaseBuilder.factory.buildStage({ targetProfileId, id: 6, level: 2, isFirstSkill: false });

      databaseBuilder.factory.buildStageAcquisition({
        stageId: 5,
        campaignParticipationId: campaignParticipation.id,
      });
      databaseBuilder.factory.buildStageAcquisition({
        stageId: 4,
        campaignParticipationId: campaignParticipation.id,
      });
      databaseBuilder.factory.buildStageAcquisition({
        stageId: 1,
        campaignParticipationId: campaignParticipation.id,
      });
      await databaseBuilder.commit();

      result = await getByCampaignParticipationId(campaignParticipation.id);
    });

    it('should return a StageAcquisitionCollection model', async function () {
      // then
      expect(result).to.be.an.instanceOf(StageAcquisitionCollection);
    });

    it('should return the correct number of reached stage', async function () {
      // then
      expect(result.reachedStageNumber).to.equal(3);
    });

    it('should return the expected reached stage', async function () {
      // then
      expect(result.reachedStage.id).to.equal(1);
    });
  });
});
