import { AnswerJobRepository } from '../../../../../src/evaluation/infrastructure/repositories/answer-job-repository.js';
import { config } from '../../../../../src/shared/config.js';
import { pgBoss } from '../../../../../src/shared/infrastructure/repositories/jobs/pg-boss.js';
import { expect, sinon } from '../../../../test-helper.js';

describe('Evaluation | Unit | Infrastructure | Repositories | AnswerJobRepository', function () {
  beforeEach(function () {
    sinon.stub(config, 'featureToggles');
    sinon.stub(pgBoss, 'insert').resolves([]);
    config.featureToggles.isQuestEnabled = true;
    config.featureToggles.isAsyncQuestRewardingCalculationEnabled = true;
  });

  describe('#performAsync', function () {
    it('should do nothing if quests are disabled', async function () {
      // given
      const profileRewardTemporaryStorageStub = { increment: sinon.stub() };
      config.featureToggles.isQuestEnabled = false;
      const userId = Symbol('userId');
      const answerJobRepository = new AnswerJobRepository({
        dependencies: { profileRewardTemporaryStorage: profileRewardTemporaryStorageStub },
      });

      // when
      await answerJobRepository.performAsync({ userId });

      // then
      expect(profileRewardTemporaryStorageStub.increment).not.to.have.been.called;
    });

    it('should do nothing if quests are in sync mode', async function () {
      // given
      const profileRewardTemporaryStorageStub = { increment: sinon.stub() };
      config.featureToggles.isAsyncQuestRewardingCalculationEnabled = false;
      const userId = Symbol('userId');
      const answerJobRepository = new AnswerJobRepository({
        dependencies: { profileRewardTemporaryStorage: profileRewardTemporaryStorageStub },
      });

      // when
      await answerJobRepository.performAsync({ userId });

      // then
      expect(profileRewardTemporaryStorageStub.increment).not.to.have.been.called;
    });

    it("should increment user's jobs count in temporary storage", async function () {
      // given
      const profileRewardTemporaryStorageStub = { increment: sinon.stub() };
      const userId = Symbol('userId');
      const answerJobRepository = new AnswerJobRepository({
        dependencies: { profileRewardTemporaryStorage: profileRewardTemporaryStorageStub },
      });

      // when
      await answerJobRepository.performAsync({ userId });

      // then
      expect(profileRewardTemporaryStorageStub.increment).to.have.been.calledWith(userId);
    });
  });
});
