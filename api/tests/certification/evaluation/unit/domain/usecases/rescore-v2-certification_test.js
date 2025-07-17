import { ChallengeNeutralized } from '../../../../../../src/certification/evaluation/domain/events/ChallengeNeutralized.js';
import { rescoreV2Certification } from '../../../../../../src/certification/evaluation/domain/usecases/rescore-v2-certification.js';
import { SessionAlreadyPublishedError } from '../../../../../../src/certification/session-management/domain/errors.js';
import { CertificationCourseRejected } from '../../../../../../src/certification/session-management/domain/events/CertificationCourseRejected.js';
import { CertificationAssessment } from '../../../../../../src/certification/session-management/domain/models/CertificationAssessment.js';
import { AlgorithmEngineVersion } from '../../../../../../src/certification/shared/domain/models/AlgorithmEngineVersion.js';
import { ComplementaryCertificationKeys } from '../../../../../../src/certification/shared/domain/models/ComplementaryCertificationKeys.js';
import { CertificationComputeError, NotFinalizedSessionError } from '../../../../../../src/shared/domain/errors.js';
import { AssessmentResult } from '../../../../../../src/shared/domain/models/index.js';
import { catchErr, domainBuilder, expect, sinon } from '../../../../../test-helper.js';

describe('Unit | Certification | Evaluation | UseCases | rescore-v2-certification', function () {
  describe('session is not in a publishable state', function () {
    it('should reject to do a rescoring is session is still in progress', async function () {
      // given
      const certificationCourseId = 123;
      const sessionNotFinalized = domainBuilder.certification.evaluation.buildResultsSession();
      const evaluationSessionRepository = { getByCertificationCourseId: sinon.stub().resolves(sessionNotFinalized) };

      const event = new CertificationCourseRejected({
        certificationCourseId,
      });

      // when
      const error = await catchErr(rescoreV2Certification)({
        event,
        evaluationSessionRepository,
      });

      // then
      expect(evaluationSessionRepository.getByCertificationCourseId).to.have.been.calledOnceWithExactly({
        certificationCourseId,
      });
      expect(error).to.be.instanceOf(NotFinalizedSessionError);
    });

    it('should reject to do a rescoring on a published session', async function () {
      // given

      const certificationCourseId = 123;
      const sessionStillPublished = domainBuilder.certification.evaluation.buildResultsSession.published();
      const evaluationSessionRepository = { getByCertificationCourseId: sinon.stub().resolves(sessionStillPublished) };

      const event = new CertificationCourseRejected({
        certificationCourseId,
      });

      // when
      const error = await catchErr(rescoreV2Certification)({
        event,
        evaluationSessionRepository,
      });

      // then
      expect(evaluationSessionRepository.getByCertificationCourseId).to.have.been.calledOnceWithExactly({
        certificationCourseId,
      });
      expect(error).to.be.instanceOf(SessionAlreadyPublishedError);
    });
  });

  describe('when handling a v2 certification', function () {
    let assessmentResultRepository,
      certificationAssessmentRepository,
      complementaryCertificationScoringCriteriaRepository,
      evaluationSessionRepository,
      services,
      dependencies;

    beforeEach(function () {
      const session = domainBuilder.certification.evaluation.buildResultsSession.finalized();
      evaluationSessionRepository = { getByCertificationCourseId: sinon.stub().resolves(session) };
      assessmentResultRepository = { save: sinon.stub() };
      certificationAssessmentRepository = { getByCertificationCourseId: sinon.stub() };
      services = {
        handleV2CertificationScoring: sinon.stub(),
        scoreComplementaryCertificationV2: sinon.stub(),
      };

      complementaryCertificationScoringCriteriaRepository = {
        findByCertificationCourseId: sinon.stub(),
      };

      dependencies = {
        assessmentResultRepository,
        certificationAssessmentRepository,
        complementaryCertificationScoringCriteriaRepository,
        evaluationSessionRepository,
        services,
      };
    });

    context('when computation fails', function () {
      it('computes and persists the assessment result in error', async function () {
        // given
        const event = new ChallengeNeutralized({ certificationCourseId: 1, juryId: 7 });
        const certificationAssessment = new CertificationAssessment({
          id: 123,
          userId: 123,
          certificationCourseId: 789,
          createdAt: new Date('2020-01-01'),
          completedAt: new Date('2020-01-01'),
          state: CertificationAssessment.states.STARTED,
          version: 2,
          certificationChallenges: [
            domainBuilder.buildCertificationChallengeWithType({ isNeutralized: false }),
            domainBuilder.buildCertificationChallengeWithType({ isNeutralized: false }),
          ],
          certificationAnswersByDate: ['answer'],
        });
        certificationAssessmentRepository.getByCertificationCourseId
          .withArgs({ certificationCourseId: 1 })
          .resolves(certificationAssessment);

        services.handleV2CertificationScoring.rejects(new CertificationComputeError('Oopsie'));

        const assessmentResultToBeSaved = new AssessmentResult({
          id: undefined,
          commentByJury: 'Oopsie',
          pixScore: 0,
          reproducibilityRate: 0,
          status: AssessmentResult.status.ERROR,
          assessmentId: 123,
          juryId: 7,
        });
        const savedAssessmentResult = new AssessmentResult({ ...assessmentResultToBeSaved, id: 4 });
        assessmentResultRepository.save
          .withArgs({
            certificationCourseId: 123,
            assessmentResult: assessmentResultToBeSaved,
          })
          .resolves(savedAssessmentResult);

        // when
        await rescoreV2Certification({
          event,
          ...dependencies,
        });

        // then
        expect(assessmentResultRepository.save).to.have.been.calledOnce;
      });
    });

    context('when assessment in only about complementary certification', function () {
      it('should return', async function () {
        // given
        const event = new ChallengeNeutralized({ certificationCourseId: 1, juryId: 7 });
        const certificationAssessment = new CertificationAssessment({
          id: 123,
          userId: 123,
          certificationCourseId: 789,
          createdAt: new Date('2020-01-01'),
          completedAt: new Date('2020-01-01'),
          state: CertificationAssessment.states.STARTED,
          version: AlgorithmEngineVersion.V2,
          certificationChallenges: [
            domainBuilder.buildCertificationChallengeWithType({ certifiableBadgeKey: 'TOTO' }),
            domainBuilder.buildCertificationChallengeWithType({ certifiableBadgeKey: 'TOTO' }),
          ],
          certificationAnswersByDate: ['answer'],
        });
        certificationAssessmentRepository.getByCertificationCourseId
          .withArgs({ certificationCourseId: 1 })
          .resolves(certificationAssessment);

        // when
        await rescoreV2Certification({
          event,
          ...dependencies,
        });

        // then
        expect(services.handleV2CertificationScoring).to.not.have.been.called;
        expect(assessmentResultRepository.save).to.not.have.been.called;
      });
    });

    context('when certification is a complementary certification', function () {
      it('should also trigger the complementary certification scoring', async function () {
        // given
        const certificationCourseId = 1;
        const event = new ChallengeNeutralized({ certificationCourseId, juryId: 7 });
        const certificationAssessment = new CertificationAssessment({
          id: 123,
          userId: 123,
          certificationCourseId,
          createdAt: new Date('2020-01-01'),
          completedAt: new Date('2020-01-01'),
          state: CertificationAssessment.states.STARTED,
          version: 2,
          certificationChallenges: [
            domainBuilder.buildCertificationChallengeWithType({}),
            domainBuilder.buildCertificationChallengeWithType({}),
          ],
          certificationAnswersByDate: ['answer'],
        });

        certificationAssessmentRepository.getByCertificationCourseId
          .withArgs({ certificationCourseId })
          .resolves(certificationAssessment);

        const certificationCourse = domainBuilder.buildCertificationCourse({
          id: certificationCourseId,
          isRejectedForFraud: true,
        });
        services.handleV2CertificationScoring.resolves(certificationCourse);
        const complementaryCertificationScoringCriteria =
          domainBuilder.certification.evaluation.buildComplementaryCertificationScoringCriteria({
            complementaryCertificationCourseId: 999,
            complementaryCertificationBadgeId: 888,
            minimumReproducibilityRate: 75,
            minimumReproducibilityRateLowerLevel: 60,
            minimumEarnedPix: 20,
            complementaryCertificationBadgeKey: ComplementaryCertificationKeys.PIX_PLUS_DROIT,
            hasComplementaryReferential: true,
          });
        complementaryCertificationScoringCriteriaRepository.findByCertificationCourseId
          .withArgs({ certificationCourseId })
          .resolves([complementaryCertificationScoringCriteria]);

        // when
        await rescoreV2Certification({
          event,
          ...dependencies,
        });

        // then
        expect(services.scoreComplementaryCertificationV2).to.have.been.calledOnceWithExactly({
          certificationCourseId,
          complementaryCertificationScoringCriteria,
        });
      });
    });
  });
});
