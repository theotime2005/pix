import { CertificationCompletedJob } from '../../../../../../src/certification/evaluation/domain/events/CertificationCompleted.js';
import { scoreCompletedV2Certification } from '../../../../../../src/certification/evaluation/domain/usecases/score-completed-v2-certification.js';
import { AssessmentResultFactory } from '../../../../../../src/certification/scoring/domain/models/factories/AssessmentResultFactory.js';
import { AlgorithmEngineVersion } from '../../../../../../src/certification/shared/domain/models/AlgorithmEngineVersion.js';
import { CertificationComputeError } from '../../../../../../src/shared/domain/errors.js';
import { CertificationCourse } from '../../../../../../src/shared/domain/models/index.js';
import { catchErr, domainBuilder, expect, sinon } from '../../../../../test-helper.js';

describe('Unit | Certification | Evaluation | UseCases | scoreCompletedV2Certification', function () {
  let assessmentResultRepository;
  let certificationCourseRepository;
  let complementaryCertificationScoringCriteriaRepository;
  let competenceMarkRepository;
  let services;

  let clock;

  beforeEach(function () {
    clock = sinon.useFakeTimers({ now: new Date('2019-01-01T05:06:07Z'), toFake: ['Date'] });

    services = {
      handleV2CertificationScoring: sinon.stub(),
      scoreComplementaryCertificationV2: sinon.stub(),
    };
    assessmentResultRepository = { save: sinon.stub() };
    certificationCourseRepository = {
      get: sinon.stub(),
      update: sinon.stub(),
      getCreationDate: sinon.stub(),
    };
    competenceMarkRepository = { save: sinon.stub() };
    complementaryCertificationScoringCriteriaRepository = { findByCertificationCourseId: sinon.stub() };
  });

  afterEach(function () {
    clock.restore();
  });

  context('when assessment is of type CERTIFICATION', function () {
    const assessmentId = 1214;
    const certificationCourseId = 1234;
    const userId = 4567;

    context('when certification is V2', function () {
      let data;
      let certificationAssessment;

      beforeEach(function () {
        data = new CertificationCompletedJob({
          assessmentId,
          userId,
          certificationCourseId: 123,
        });
        certificationAssessment = domainBuilder.buildCertificationAssessment({
          id: assessmentId,
          certificationCourseId,
          userId,
          version: AlgorithmEngineVersion.V2,
        });
      });

      context('when an error different from a compute error happens', function () {
        it('should not save any results', async function () {
          // given
          const otherError = new Error();
          services.handleV2CertificationScoring.rejects(otherError);
          sinon.stub(AssessmentResultFactory, 'buildAlgoErrorResult');

          const dependencies = {
            services,
          };

          // when
          await catchErr(scoreCompletedV2Certification)(data, dependencies);

          // then
          expect(AssessmentResultFactory.buildAlgoErrorResult).to.not.have.been.called;
          expect(assessmentResultRepository.save).to.not.have.been.called;
          expect(certificationCourseRepository.update).to.not.have.been.called;
        });
      });

      context('when an error of type CertificationComputeError happens while scoring the assessment', function () {
        it('should save the error result appropriately', async function () {
          // given
          const errorAssessmentResult = domainBuilder.buildAssessmentResult({ id: 98 });
          const certificationCourse = domainBuilder.buildCertificationCourse({
            id: certificationCourseId,
            completedAt: null,
          });
          const computeError = new CertificationComputeError();

          services.handleV2CertificationScoring.rejects(computeError);
          sinon.stub(AssessmentResultFactory, 'buildAlgoErrorResult').returns(errorAssessmentResult);
          assessmentResultRepository.save.resolves(errorAssessmentResult);
          certificationCourseRepository.get
            .withArgs({ id: certificationAssessment.certificationCourseId })
            .resolves(certificationCourse);
          certificationCourseRepository.update.resolves(certificationCourse);

          const dependencies = {
            assessmentResultRepository,
            certificationCourseRepository,
            competenceMarkRepository,
            services,
          };

          // when
          await scoreCompletedV2Certification({ certificationAssessment, ...dependencies });

          // then
          expect(AssessmentResultFactory.buildAlgoErrorResult).to.have.been.calledWithExactly({
            error: computeError,
            assessmentId: certificationAssessment.id,
          });
          expect(assessmentResultRepository.save).to.have.been.calledWithExactly({
            certificationCourseId: 1234,
            assessmentResult: errorAssessmentResult,
          });
          expect(certificationCourseRepository.update).to.have.been.calledWithExactly({
            certificationCourse: new CertificationCourse({
              ...certificationCourse.toDTO(),
              completedAt: new Date(clock.now),
            }),
          });
        });
      });

      context('when scoring is successful', function () {
        it('should save a complete certification course', async function () {
          // given
          const certificationCourse = domainBuilder.buildCertificationCourse({
            id: certificationCourseId,
            completedAt: null,
            isCancelled: false,
            abortReason: null,
          });

          certificationCourseRepository.update.resolves(certificationCourse);
          services.handleV2CertificationScoring.resolves({ certificationCourse });

          const complementaryCertificationScoringCriteria =
            domainBuilder.certification.evaluation.buildComplementaryCertificationScoringCriteria({
              complementaryCertificationCourseId: 999,
              complementaryCertificationBadgeId: 888,
              minimumReproducibilityRate: 75,
              minimumReproducibilityRateLowerLevel: 60,
              minimumEarnedPix: 20,
              complementaryCertificationBadgeKey: 'PIX_PLUS_TEST',
              hasComplementaryReferential: true,
            });
          complementaryCertificationScoringCriteriaRepository.findByCertificationCourseId
            .withArgs({
              certificationCourseId: 1234,
            })
            .resolves([complementaryCertificationScoringCriteria]);

          const dependencies = {
            assessmentResultRepository,
            certificationCourseRepository,
            complementaryCertificationScoringCriteriaRepository,
            competenceMarkRepository,
            services,
          };

          // when
          await scoreCompletedV2Certification({ certificationAssessment, ...dependencies });

          // then
          expect(certificationCourseRepository.update).to.have.been.calledWithExactly({
            certificationCourse: new CertificationCourse({
              ...certificationCourse.toDTO(),
              completedAt: new Date(clock.now),
            }),
          });
          expect(services.scoreComplementaryCertificationV2).to.have.been.calledOnceWithExactly({
            certificationCourseId: 1234,
            complementaryCertificationScoringCriteria,
          });
        });
      });

      context('when assessment only has only complementary certification challenges', function () {
        it('should return', async function () {
          // given
          const certificationAssessmentWithOnlyComplementaryCertificationChallenges =
            domainBuilder.buildCertificationAssessment({
              id: assessmentId,
              certificationCourseId,
              userId,
              version: AlgorithmEngineVersion.V2,
              certificationChallenges: [
                domainBuilder.buildCertificationChallengeWithType({
                  id: 1234,
                  certifiableBadgeKey: 'TOTO',
                }),
                domainBuilder.buildCertificationChallengeWithType({
                  id: 567,
                  certifiableBadgeKey: 'TOTO',
                }),
                domainBuilder.buildCertificationChallengeWithType({
                  id: 8910,
                  certifiableBadgeKey: 'TOTO',
                }),
              ],
            });

          const dependencies = {
            assessmentResultRepository,
            certificationCourseRepository,
            competenceMarkRepository,
            services,
          };

          // when
          await scoreCompletedV2Certification({
            certificationAssessment: certificationAssessmentWithOnlyComplementaryCertificationChallenges,
            ...dependencies,
          });

          // then
          expect(certificationCourseRepository.update).to.not.have.been.called;
        });
      });
    });
  });
});
