import { rescoreV3Certification } from '../../../../../../src/certification/evaluation/domain/usecases/rescore-v3-certification.js';
import { SessionAlreadyPublishedError } from '../../../../../../src/certification/session-management/domain/errors.js';
import { CertificationCourseRejected } from '../../../../../../src/certification/session-management/domain/events/CertificationCourseRejected.js';
import { CertificationJuryDone } from '../../../../../../src/certification/session-management/domain/events/CertificationJuryDone.js';
import { AlgorithmEngineVersion } from '../../../../../../src/certification/shared/domain/models/AlgorithmEngineVersion.js';
import { ABORT_REASONS } from '../../../../../../src/certification/shared/domain/models/CertificationCourse.js';
import { DomainTransaction } from '../../../../../../src/shared/domain/DomainTransaction.js';
import { NotFinalizedSessionError } from '../../../../../../src/shared/domain/errors.js';
import { catchErr, domainBuilder, expect, sinon } from '../../../../../test-helper.js';

describe('Unit | Certification | Evaluation | UseCases | rescore-v3-certification', function () {
  beforeEach(function () {
    sinon.stub(DomainTransaction, 'execute').callsFake((callback) => {
      return callback();
    });
  });
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
      const error = await catchErr(rescoreV3Certification)({
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
      const error = await catchErr(rescoreV3Certification)({
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

  describe('when handling a v3 certification', function () {
    let assessmentResultRepository,
      certificationAssessmentRepository,
      complementaryCertificationScoringCriteriaRepository,
      evaluationSessionRepository,
      scoringCertificationService,
      services,
      dependencies;

    beforeEach(function () {
      certificationAssessmentRepository = { getByCertificationCourseId: sinon.stub() };
      const session = domainBuilder.certification.evaluation.buildResultsSession.finalized();
      evaluationSessionRepository = { getByCertificationCourseId: sinon.stub().resolves(session) };
      services = { handleV3CertificationScoring: sinon.stub(), scoreDoubleCertificationV3: sinon.stub() };

      dependencies = {
        assessmentResultRepository,
        certificationAssessmentRepository,
        complementaryCertificationScoringCriteriaRepository,
        evaluationSessionRepository,
        scoringCertificationService,
        services,
      };
    });

    describe('when less than the minimum number of answers required by the config has been answered', function () {
      describe('when the certification was not finished due to a lack of time', function () {
        it('should save the score with a rejected status', async function () {
          // given
          const certificationAssessment = domainBuilder.buildCertificationAssessment({
            version: AlgorithmEngineVersion.V3,
          });
          const abortedCertificationCourse = domainBuilder.buildCertificationCourse({
            abortReason: ABORT_REASONS.CANDIDATE,
          });
          const { certificationCourseId } = certificationAssessment;

          certificationAssessmentRepository.getByCertificationCourseId
            .withArgs({ certificationCourseId })
            .resolves(certificationAssessment);
          services.handleV3CertificationScoring.resolves(abortedCertificationCourse);

          const event = new CertificationJuryDone({
            certificationCourseId,
          });

          // when
          await rescoreV3Certification({
            ...dependencies,
            event,
          });

          // then
          expect(services.handleV3CertificationScoring).to.have.been.calledOnce;
        });
      });
    });

    describe('when not all questions were answered', function () {
      describe('when the candidate did not finish due to technical difficulties', function () {
        it('should save the raw score', async function () {
          // given
          const certificationCourseStartDate = new Date('2022-01-01');
          const certificationAssessment = domainBuilder.buildCertificationAssessment({
            version: AlgorithmEngineVersion.V3,
          });

          const abortedCertificationCourse = domainBuilder.buildCertificationCourse({
            abortReason: ABORT_REASONS.TECHNICAL,
            createdAt: certificationCourseStartDate,
          });
          const { certificationCourseId } = certificationAssessment;

          certificationAssessmentRepository.getByCertificationCourseId
            .withArgs({ certificationCourseId })
            .resolves(certificationAssessment);
          services.handleV3CertificationScoring.resolves(abortedCertificationCourse);

          const event = new CertificationJuryDone({
            certificationCourseId,
          });

          // when
          await rescoreV3Certification({
            ...dependencies,
            event,
          });

          // then
          expect(services.handleV3CertificationScoring).to.have.been.calledOnce;
        });
      });
    });

    describe('when all the questions were answered', function () {
      it('should save the score', async function () {
        // given
        const certificationCourseStartDate = new Date('2022-01-01');
        const certificationAssessment = domainBuilder.buildCertificationAssessment({
          version: AlgorithmEngineVersion.V3,
        });

        const abortedCertificationCourse = domainBuilder.buildCertificationCourse({
          abortReason: ABORT_REASONS.TECHNICAL,
          createdAt: certificationCourseStartDate,
        });
        const { certificationCourseId } = certificationAssessment;

        certificationAssessmentRepository.getByCertificationCourseId
          .withArgs({ certificationCourseId })
          .resolves(certificationAssessment);
        services.handleV3CertificationScoring.resolves(abortedCertificationCourse);
        const event = new CertificationJuryDone({
          certificationCourseId,
        });

        // when
        await rescoreV3Certification({
          ...dependencies,
          event,
        });

        // then
        expect(services.handleV3CertificationScoring).to.have.been.calledOnce;
      });

      describe('when certification is rejected for fraud', function () {
        it('should save the score with rejected status', async function () {
          const certificationCourseStartDate = new Date('2022-01-01');
          // given
          const certificationAssessment = domainBuilder.buildCertificationAssessment({
            version: AlgorithmEngineVersion.V3,
          });

          const abortedCertificationCourse = domainBuilder.buildCertificationCourse({
            isRejectedForFraud: true,
            createdAt: certificationCourseStartDate,
          });
          const { certificationCourseId } = certificationAssessment;

          certificationAssessmentRepository.getByCertificationCourseId
            .withArgs({ certificationCourseId })
            .resolves(certificationAssessment);
          services.handleV3CertificationScoring.resolves(abortedCertificationCourse);

          const event = new CertificationCourseRejected({
            certificationCourseId,
            juryId: 7,
          });

          // when
          await rescoreV3Certification({
            ...dependencies,
            event,
          });

          // then
          expect(services.handleV3CertificationScoring).to.have.been.calledOnce;
        });
      });
    });

    context('when it is a double certification', function () {
      it('should trigger complementary certification scoring', async function () {
        // given
        const certificationCourseStartDate = new Date('2022-01-01');
        const certificationAssessment = domainBuilder.buildCertificationAssessment({
          version: AlgorithmEngineVersion.V3,
        });

        const abortedCertificationCourse = domainBuilder.buildCertificationCourse({
          abortReason: ABORT_REASONS.TECHNICAL,
          createdAt: certificationCourseStartDate,
        });
        const { certificationCourseId } = certificationAssessment;

        certificationAssessmentRepository.getByCertificationCourseId
          .withArgs({ certificationCourseId })
          .resolves(certificationAssessment);

        services.handleV3CertificationScoring.resolves(abortedCertificationCourse);
        services.scoreDoubleCertificationV3.resolves(abortedCertificationCourse);

        const event = new CertificationJuryDone({
          certificationCourseId,
        });

        // when
        await rescoreV3Certification({
          ...dependencies,
          event,
        });

        // then
        expect(services.handleV3CertificationScoring).to.have.been.calledOnce;
        expect(services.scoreDoubleCertificationV3).to.have.been.calledOnceWithExactly({ certificationCourseId });
      });
    });
  });
});
