import { scoreDoubleCertificationV3 } from '../../../../../../../src/certification/evaluation/domain/services/scoring/score-double-certification-v3.js';
import { ComplementaryCertificationCourseResult } from '../../../../../../../src/certification/shared/domain/models/ComplementaryCertificationCourseResult.js';
import { domainBuilder, expect, sinon } from '../../../../../../test-helper.js';

describe('Certification | Evaluation | Unit | Domain | Services | Scoring Double Certification V3', function () {
  const complementaryCertificationCourseResultRepository = {};
  const assessmentResultRepository = {};
  const complementaryCertificationScoringCriteriaRepository = {};
  const certificationCourseRepository = {};

  const dependencies = {
    certificationCourseRepository,
    assessmentResultRepository,
    complementaryCertificationScoringCriteriaRepository,
    complementaryCertificationCourseResultRepository,
  };

  beforeEach(function () {
    complementaryCertificationCourseResultRepository.save = sinon.stub();
    assessmentResultRepository.getByCertificationCourseId = sinon.stub();
    assessmentResultRepository.updateToAcquiredLowerLevelComplementaryCertification = sinon.stub();
    complementaryCertificationScoringCriteriaRepository.findByCertificationCourseId = sinon.stub();
    certificationCourseRepository.get = sinon.stub();
  });

  context('when there is no complementary referential', function () {
    it('should score the complementary certification', async function () {
      // given
      const certificationCourseId = 123;
      const complementaryCertificationScoringCriteria = domainBuilder.buildComplementaryCertificationScoringCriteria({
        complementaryCertificationCourseId: 999,
        complementaryCertificationBadgeId: 888,
        minimumReproducibilityRate: 70,
        minimumEarnedPix: 50,
        complementaryCertificationBadgeKey: 'PIX_PLUS_TEST',
        hasComplementaryReferential: false,
      });
      complementaryCertificationScoringCriteriaRepository.findByCertificationCourseId
        .withArgs({
          certificationCourseId,
        })
        .resolves([complementaryCertificationScoringCriteria]);

      assessmentResultRepository.getByCertificationCourseId
        .withArgs({ certificationCourseId })
        .resolves(domainBuilder.buildAssessmentResult({ pixScore: 128, reproducibilityRate: 100 }));
      certificationCourseRepository.get
        .withArgs({ id: certificationCourseId })
        .resolves(domainBuilder.buildCertificationCourse());

      // when
      await scoreDoubleCertificationV3({
        ...dependencies,
        certificationCourseId,
      });

      // then

      expect(complementaryCertificationCourseResultRepository.save).to.have.been.calledWithExactly(
        ComplementaryCertificationCourseResult.from({
          complementaryCertificationCourseId: 999,
          complementaryCertificationBadgeId: 888,
          source: ComplementaryCertificationCourseResult.sources.PIX,
          acquired: true,
        }),
      );
    });

    context('scoring', function () {
      it('should save a "not acquired" complementary certification when pix score and reproducibility rate are below expectations', async function () {
        // given
        const certificationCourseId = 123;
        assessmentResultRepository.getByCertificationCourseId.withArgs({ certificationCourseId }).resolves(
          domainBuilder.buildAssessmentResult.validated({
            pixScore: 45,
            reproducibilityRate: 70,
          }),
        );
        const complementaryCertificationScoringCriteria = domainBuilder.buildComplementaryCertificationScoringCriteria({
          complementaryCertificationCourseId: 999,
          complementaryCertificationBadgeId: 888,
          minimumReproducibilityRate: 75,
          complementaryCertificationBadgeKey: 'PIX_PLUS_TEST',
          hasComplementaryReferential: false,
          minimumEarnedPix: 50,
        });
        complementaryCertificationScoringCriteriaRepository.findByCertificationCourseId
          .withArgs({
            certificationCourseId,
          })
          .resolves([complementaryCertificationScoringCriteria]);
        certificationCourseRepository.get
          .withArgs({ id: certificationCourseId })
          .resolves(domainBuilder.buildCertificationCourse());

        // when
        await scoreDoubleCertificationV3({
          ...dependencies,
          certificationCourseId,
        });

        // then
        expect(complementaryCertificationCourseResultRepository.save).to.have.been.calledWithExactly(
          ComplementaryCertificationCourseResult.from({
            complementaryCertificationCourseId: 999,
            complementaryCertificationBadgeId: 888,
            source: ComplementaryCertificationCourseResult.sources.PIX,
            acquired: false,
          }),
        );
      });

      it('should save a "not acquired" complementary certification when pix score is above expectation and repro rate is not', async function () {
        // given
        const certificationCourseId = 123;
        const complementaryCertificationScoringCriteria = domainBuilder.buildComplementaryCertificationScoringCriteria({
          complementaryCertificationCourseId: 999,
          complementaryCertificationBadgeId: 888,
          minimumReproducibilityRate: 75,
          complementaryCertificationBadgeKey: 'PIX_PLUS_TEST',
          hasComplementaryReferential: false,
          minimumEarnedPix: 50,
        });
        complementaryCertificationScoringCriteriaRepository.findByCertificationCourseId
          .withArgs({
            certificationCourseId,
          })
          .resolves([complementaryCertificationScoringCriteria]);
        assessmentResultRepository.getByCertificationCourseId.withArgs({ certificationCourseId }).resolves(
          domainBuilder.buildAssessmentResult.validated({
            pixScore: 60,
            reproducibilityRate: 70,
          }),
        );
        certificationCourseRepository.get
          .withArgs({ id: certificationCourseId })
          .resolves(domainBuilder.buildCertificationCourse());

        // when
        await scoreDoubleCertificationV3({
          ...dependencies,
          certificationCourseId,
        });

        // then
        expect(complementaryCertificationCourseResultRepository.save).to.have.been.calledWithExactly(
          ComplementaryCertificationCourseResult.from({
            complementaryCertificationCourseId: 999,
            complementaryCertificationBadgeId: 888,
            source: ComplementaryCertificationCourseResult.sources.PIX,
            acquired: false,
          }),
        );
      });

      it('should save a "not acquired" complementary certification when pix score is below expectation and repro rate is above', async function () {
        // given
        const certificationCourseId = 123;
        const complementaryCertificationScoringCriteria = domainBuilder.buildComplementaryCertificationScoringCriteria({
          complementaryCertificationCourseId: 999,
          complementaryCertificationBadgeId: 888,
          minimumReproducibilityRate: 70,
          complementaryCertificationBadgeKey: 'PIX_PLUS_TEST',
          hasComplementaryReferential: false,
          minimumEarnedPix: 50,
        });
        complementaryCertificationScoringCriteriaRepository.findByCertificationCourseId
          .withArgs({
            certificationCourseId,
          })
          .resolves([complementaryCertificationScoringCriteria]);
        assessmentResultRepository.getByCertificationCourseId.withArgs({ certificationCourseId }).resolves(
          domainBuilder.buildAssessmentResult.validated({
            pixScore: 45,
            reproducibilityRate: 75,
          }),
        );
        certificationCourseRepository.get
          .withArgs({ id: certificationCourseId })
          .resolves(domainBuilder.buildCertificationCourse());

        // when
        await scoreDoubleCertificationV3({
          ...dependencies,
          certificationCourseId,
        });

        // then
        expect(complementaryCertificationCourseResultRepository.save).to.have.been.calledWithExactly(
          ComplementaryCertificationCourseResult.from({
            complementaryCertificationCourseId: 999,
            complementaryCertificationBadgeId: 888,
            source: ComplementaryCertificationCourseResult.sources.PIX,
            acquired: false,
          }),
        );
      });

      it('should save an "acquired" complementary certification when pix score and repro rate are above expectations', async function () {
        // given
        const certificationCourseId = 123;
        const complementaryCertificationScoringCriteria = domainBuilder.buildComplementaryCertificationScoringCriteria({
          complementaryCertificationCourseId: 999,
          complementaryCertificationBadgeId: 888,
          minimumReproducibilityRate: 70,
          complementaryCertificationBadgeKey: 'PIX_PLUS_TEST',
          hasComplementaryReferential: false,
          minimumEarnedPix: 50,
        });
        complementaryCertificationScoringCriteriaRepository.findByCertificationCourseId
          .withArgs({
            certificationCourseId,
          })
          .resolves([complementaryCertificationScoringCriteria]);
        assessmentResultRepository.getByCertificationCourseId.withArgs({ certificationCourseId }).resolves(
          domainBuilder.buildAssessmentResult.validated({
            pixScore: 120,
            reproducibilityRate: 75,
          }),
        );
        certificationCourseRepository.get
          .withArgs({ id: certificationCourseId })
          .resolves(domainBuilder.buildCertificationCourse());

        // when
        await scoreDoubleCertificationV3({
          ...dependencies,
          certificationCourseId,
        });

        // then
        expect(complementaryCertificationCourseResultRepository.save).to.have.been.calledWithExactly(
          ComplementaryCertificationCourseResult.from({
            complementaryCertificationCourseId: 999,
            complementaryCertificationBadgeId: 888,
            source: ComplementaryCertificationCourseResult.sources.PIX,
            acquired: true,
          }),
        );
      });

      it('should save a "not acquired" complementary certification when pix core is rejected for fraud', async function () {
        // given
        const certificationCourseId = 123;
        const complementaryCertificationScoringCriteria = domainBuilder.buildComplementaryCertificationScoringCriteria({
          complementaryCertificationCourseId: 999,
          complementaryCertificationBadgeId: 888,
          minimumReproducibilityRate: 70,
          complementaryCertificationBadgeKey: 'PIX_PLUS_TEST',
          hasComplementaryReferential: false,
          minimumEarnedPix: 50,
        });
        complementaryCertificationScoringCriteriaRepository.findByCertificationCourseId
          .withArgs({
            certificationCourseId,
          })
          .resolves([complementaryCertificationScoringCriteria]);

        assessmentResultRepository.getByCertificationCourseId.withArgs({ certificationCourseId }).resolves(
          domainBuilder.buildAssessmentResult.validated({
            pixScore: 120,
            reproducibilityRate: 75,
          }),
        );
        certificationCourseRepository.get
          .withArgs({ id: certificationCourseId })
          .resolves(domainBuilder.buildCertificationCourse({ isRejectedForFraud: true }));

        // when
        await scoreDoubleCertificationV3({
          ...dependencies,
          certificationCourseId,
        });

        // then
        expect(complementaryCertificationCourseResultRepository.save).to.have.been.calledWithExactly(
          ComplementaryCertificationCourseResult.from({
            complementaryCertificationCourseId: 999,
            complementaryCertificationBadgeId: 888,
            partnerKey: 'PIX_PLUS_TEST',
            source: ComplementaryCertificationCourseResult.sources.PIX,
            acquired: false,
          }),
        );
      });
    });
  });
});
