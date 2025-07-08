import { getCurrentConsolidatedFramework } from '../../../../../../src/certification/configuration/domain/usecases/get-current-consolidated-framework.js';
import { domainBuilder, expect, sinon } from '../../../../../test-helper.js';

describe('Certification | Configuration | Unit | UseCase | get-current-consolidated-framework', function () {
  it('should return the current consolidated framework', async function () {
    // given
    const complementaryCertificationKey = Symbol('complementaryCertificationKey');

    const consolidatedFrameworkRepository = {
      getCurrentFrameworkByComplementaryCertificationKey: sinon.stub(),
    };
    const currentConsolidatedFramework = domainBuilder.certification.configuration.buildConsolidatedFramework({
      challenges: [{ challengeId: 'rec1' }],
    });
    consolidatedFrameworkRepository.getCurrentFrameworkByComplementaryCertificationKey.resolves(
      currentConsolidatedFramework,
    );

    const learningContentRepository = {
      getConsolidatedFrameworkLearningContentByChallengeIds: sinon.stub(),
    };
    const area = domainBuilder.buildArea();
    learningContentRepository.getConsolidatedFrameworkLearningContentByChallengeIds.resolves([area]);

    // when
    const results = await getCurrentConsolidatedFramework({
      complementaryCertificationKey,
      consolidatedFrameworkRepository,
      learningContentRepository,
    });

    // then
    expect(
      consolidatedFrameworkRepository.getCurrentFrameworkByComplementaryCertificationKey,
    ).to.have.been.calledOnceWith({
      complementaryCertificationKey,
    });

    expect(learningContentRepository.getConsolidatedFrameworkLearningContentByChallengeIds).to.have.been.calledOnceWith(
      {
        challengeIds: currentConsolidatedFramework.challenges.map(({ challengeId }) => challengeId),
      },
    );
    expect(results).to.deep.equal({ ...currentConsolidatedFramework, areas: [area] });
  });
});
