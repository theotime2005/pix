import { ChallengeDeneutralized } from '../../../../../../src/certification/evaluation/domain/events/ChallengeDeneutralized.js';
import { ChallengeNeutralized } from '../../../../../../src/certification/evaluation/domain/events/ChallengeNeutralized.js';
import { handleCertificationRescoring } from '../../../../../../src/certification/evaluation/domain/usecases/handle-certification-rescoring.js';
import { SessionAlreadyPublishedError } from '../../../../../../src/certification/session-management/domain/errors.js';
import { CertificationCourseRejected } from '../../../../../../src/certification/session-management/domain/events/CertificationCourseRejected.js';
import { CertificationJuryDone } from '../../../../../../src/certification/session-management/domain/events/CertificationJuryDone.js';
import { CertificationAssessment } from '../../../../../../src/certification/session-management/domain/models/CertificationAssessment.js';
import { AlgorithmEngineVersion } from '../../../../../../src/certification/shared/domain/models/AlgorithmEngineVersion.js';
import { ABORT_REASONS } from '../../../../../../src/certification/shared/domain/models/CertificationCourse.js';
import { ComplementaryCertificationKeys } from '../../../../../../src/certification/shared/domain/models/ComplementaryCertificationKeys.js';
import { CertificationComputeError, NotFinalizedSessionError } from '../../../../../../src/shared/domain/errors.js';
import { AssessmentResult, ComplementaryCertification } from '../../../../../../src/shared/domain/models/index.js';
import { catchErr, domainBuilder, expect, sinon } from '../../../../../test-helper.js';

describe('Unit | Domain | Events | handle-certification-rescoring', function () {
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
      const error = await catchErr(handleCertificationRescoring)({
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
      const error = await catchErr(handleCertificationRescoring)({
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
      certificationCourseRepository,
      certificationAssessmentRepository,
      complementaryCertificationScoringCriteriaRepository,
      evaluationSessionRepository,
      scoringCertificationService,
      services,
      dependencies;

    beforeEach(function () {
      certificationAssessmentRepository = { getByCertificationCourseId: sinon.stub() };
      certificationCourseRepository = { update: sinon.stub() };
      const session = domainBuilder.certification.evaluation.buildResultsSession.finalized();
      evaluationSessionRepository = { getByCertificationCourseId: sinon.stub().resolves(session) };
      services = { handleV3CertificationScoring: sinon.stub(), handleV2CertificationScoring: sinon.stub() };

      dependencies = {
        assessmentResultRepository,
        certificationAssessmentRepository,
        certificationCourseRepository,
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
          const result = await handleCertificationRescoring({
            ...dependencies,
            event,
          });

          // then
          const expectedEvent = domainBuilder.buildCertificationRescoringCompletedEvent({
            certificationCourseId,
            userId: certificationAssessment.certificationCourseId,
            reproducibilityRate: 100,
          });
          expect(result).to.deep.equal(expectedEvent);
        });
      });

      describe('when the certification was not finished due to technical difficulties', function () {
        it('should save the score with a rejected status and cancel the certification course', async function () {
          // given
          const certificationAssessment = domainBuilder.buildCertificationAssessment({
            version: AlgorithmEngineVersion.V3,
          });

          const abortedCertificationCourse = domainBuilder.buildCertificationCourse({
            abortReason: ABORT_REASONS.TECHNICAL,
            isCancelled: true,
            completedAt: null,
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
          const result = await handleCertificationRescoring({
            ...dependencies,
            event,
          });

          // then
          const expectedCertificationCourse = domainBuilder.buildCertificationCourse({
            abortReason: ABORT_REASONS.TECHNICAL,
            isCancelled: true,
            completedAt: null,
          });
          expect(certificationCourseRepository.update).to.have.been.calledOnceWithExactly({
            certificationCourse: expectedCertificationCourse,
          });

          const expectedEvent = domainBuilder.buildCertificationRescoringCompletedEvent({
            certificationCourseId,
            userId: certificationAssessment.certificationCourseId,
            reproducibilityRate: 100,
          });
          expect(result).to.deep.equal(expectedEvent);
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
          const result = await handleCertificationRescoring({
            ...dependencies,
            event,
          });

          // then
          const expectedEvent = domainBuilder.buildCertificationRescoringCompletedEvent({
            certificationCourseId,
            userId: certificationAssessment.certificationCourseId,
            reproducibilityRate: 100,
          });

          expect(result).to.deep.equal(expectedEvent);
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
        const result = await handleCertificationRescoring({
          ...dependencies,
          event,
        });

        // then
        const expectedEvent = domainBuilder.buildCertificationRescoringCompletedEvent({
          certificationCourseId,
          userId: certificationAssessment.certificationCourseId,
          reproducibilityRate: 100,
        });

        expect(result).to.deep.equal(expectedEvent);
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
          const result = await handleCertificationRescoring({
            ...dependencies,
            event,
          });

          // then
          const expectedEvent = domainBuilder.buildCertificationRescoringCompletedEvent({
            certificationCourseId,
            userId: certificationAssessment.certificationCourseId,
            reproducibilityRate: 100,
          });

          expect(result).to.deep.equal(expectedEvent);
        });
      });
    });
  });

  describe('when handling a v2 certification', function () {
    let assessmentResultRepository,
      certificationCourseRepository,
      certificationAssessmentRepository,
      complementaryCertificationScoringCriteriaRepository,
      evaluationSessionRepository,
      scoringCertificationService,
      services,
      dependencies;

    beforeEach(function () {
      certificationCourseRepository = {
        get: sinon.stub(),
        update: sinon.stub(),
      };
      const session = domainBuilder.certification.evaluation.buildResultsSession.finalized();
      evaluationSessionRepository = { getByCertificationCourseId: sinon.stub().resolves(session) };
      assessmentResultRepository = { save: sinon.stub() };
      certificationAssessmentRepository = { getByCertificationCourseId: sinon.stub() };
      scoringCertificationService = {
        isLackOfAnswersForTechnicalReason: sinon.stub(),
      };
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
        certificationCourseRepository,
        complementaryCertificationScoringCriteriaRepository,
        evaluationSessionRepository,
        scoringCertificationService,
        services,
      };
    });

    context('when the certification has not enough non neutralized challenges to be trusted', function () {
      it('cancels the certification', async function () {
        // given
        const certificationCourse = domainBuilder.buildCertificationCourse({ id: 789 });

        const event = new ChallengeNeutralized({ certificationCourseId: 789, juryId: 7 });
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
        const competenceMark2 = domainBuilder.buildCompetenceMark({ score: 12 });
        const competenceMark1 = domainBuilder.buildCompetenceMark({ score: 18 });
        const certificationAssessmentScore = domainBuilder.buildCertificationAssessmentScore({
          status: AssessmentResult.status.VALIDATED,
          competenceMarks: [competenceMark1, competenceMark2],
          percentageCorrectAnswers: 80,
          hasEnoughNonNeutralizedChallengesToBeTrusted: false,
        });

        certificationAssessmentRepository.getByCertificationCourseId
          .withArgs({ certificationCourseId: 789 })
          .resolves(certificationAssessment);

        complementaryCertificationScoringCriteriaRepository.findByCertificationCourseId
          .withArgs({ certificationCourseId: 789 })
          .resolves([]);

        services.handleV2CertificationScoring.resolves({
          certificationCourse,
          certificationAssessmentScore,
        });
        scoringCertificationService.isLackOfAnswersForTechnicalReason.resolves(true);
        certificationCourseRepository.update.resolves(certificationCourse);

        // when
        await handleCertificationRescoring({
          event,
          ...dependencies,
        });

        // then
        const expectedCertificationCourse = domainBuilder.buildCertificationCourse({
          id: certificationCourse.getId(),
          isCancelled: true,
        });
        expect(certificationCourseRepository.update).to.have.been.calledWithExactly({
          certificationCourse: expectedCertificationCourse,
        });
      });

      context('when it has insufficient correct answers', function () {
        it('cancels the certification', async function () {
          // given
          const certificationCourse = domainBuilder.buildCertificationCourse({ id: 789 });

          const event = new ChallengeNeutralized({ certificationCourseId: 789, juryId: 7 });
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
          const certificationAssessmentScore = domainBuilder.buildCertificationAssessmentScore({
            status: AssessmentResult.status.REJECTED,
            percentageCorrectAnswers: 45,
            hasEnoughNonNeutralizedChallengesToBeTrusted: false,
          });

          certificationAssessmentRepository.getByCertificationCourseId
            .withArgs({ certificationCourseId: 789 })
            .resolves(certificationAssessment);

          complementaryCertificationScoringCriteriaRepository.findByCertificationCourseId
            .withArgs({ certificationCourseId: 789 })
            .resolves([]);

          services.handleV2CertificationScoring.resolves({
            certificationCourse,
            certificationAssessmentScore,
          });
          scoringCertificationService.isLackOfAnswersForTechnicalReason.resolves(true);
          certificationCourseRepository.update.resolves(certificationCourse);

          // when
          await handleCertificationRescoring({
            event,
            ...dependencies,
          });

          // then
          const expectedCertificationCourse = domainBuilder.buildCertificationCourse({
            id: certificationCourse.getId(),
            isCancelled: true,
          });
          expect(certificationCourseRepository.update).to.have.been.calledWithExactly({
            certificationCourse: expectedCertificationCourse,
          });
        });
      });
    });

    context('when the certification has enough non neutralized challenges to be trusted', function () {
      it('uncancels the certification', async function () {
        // given
        const certificationCourse = domainBuilder.buildCertificationCourse({ id: 789, isCancelled: true });
        const event = new ChallengeNeutralized({ certificationCourseId: 789, juryId: 7 });
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
        const competenceMark2 = domainBuilder.buildCompetenceMark({ score: 12 });
        const competenceMark1 = domainBuilder.buildCompetenceMark({ score: 18 });
        const certificationAssessmentScore = domainBuilder.buildCertificationAssessmentScore({
          status: AssessmentResult.status.VALIDATED,
          competenceMarks: [competenceMark1, competenceMark2],
          percentageCorrectAnswers: 80,
          hasEnoughNonNeutralizedChallengesToBeTrusted: true,
        });

        certificationAssessmentRepository.getByCertificationCourseId
          .withArgs({ certificationCourseId: 789 })
          .resolves(certificationAssessment);

        complementaryCertificationScoringCriteriaRepository.findByCertificationCourseId
          .withArgs({ certificationCourseId: 789 })
          .resolves([]);

        services.handleV2CertificationScoring.resolves({
          certificationCourse,
          certificationAssessmentScore,
        });
        scoringCertificationService.isLackOfAnswersForTechnicalReason.resolves(false);
        certificationCourseRepository.update.resolves(certificationCourse);

        // when
        await handleCertificationRescoring({
          event,
          ...dependencies,
        });

        // then
        const expectedCertificationCourse = domainBuilder.buildCertificationCourse({ id: 789, isCancelled: false });
        expect(certificationCourseRepository.update).to.have.been.calledWithExactly({
          certificationCourse: expectedCertificationCourse,
        });
      });
    });

    context('when the certification course is rejected', function () {
      context('when it is rejected for fraud', function () {
        it('rejects the certification', async function () {
          // given
          const certificationCourse = domainBuilder.buildCertificationCourse({
            id: 789,
            isRejectedForFraud: true,
          });

          const event = new ChallengeNeutralized({ certificationCourseId: 789, juryId: 7 });
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
          const competenceMark2 = domainBuilder.buildCompetenceMark({ score: 12 });
          const competenceMark1 = domainBuilder.buildCompetenceMark({ score: 18 });
          const certificationAssessmentScore = domainBuilder.buildCertificationAssessmentScore({
            status: AssessmentResult.status.VALIDATED,
            competenceMarks: [competenceMark1, competenceMark2],
            percentageCorrectAnswers: 80,
            hasEnoughNonNeutralizedChallengesToBeTrusted: true,
          });

          certificationAssessmentRepository.getByCertificationCourseId
            .withArgs({ certificationCourseId: 789 })
            .resolves(certificationAssessment);

          complementaryCertificationScoringCriteriaRepository.findByCertificationCourseId
            .withArgs({ certificationCourseId: 789 })
            .resolves([]);

          services.handleV2CertificationScoring.resolves({
            certificationCourse,
            certificationAssessmentScore,
          });
          scoringCertificationService.isLackOfAnswersForTechnicalReason.resolves(false);
          certificationCourseRepository.update.resolves(certificationCourse);

          // when
          await handleCertificationRescoring({
            event,
            ...dependencies,
          });

          // then
          const expectedCertificationCourse = domainBuilder.buildCertificationCourse({
            id: 789,
            isRejectedForFraud: true,
          });
          expect(certificationCourseRepository.update).to.have.been.calledWithExactly({
            certificationCourse: expectedCertificationCourse,
          });
        });
      });

      context('when it is rejected for insufficient correct answers', function () {
        it('should create and save an insufficient correct answers assessment result', async function () {
          // given
          const certificationCourse = domainBuilder.buildCertificationCourse({
            id: 789,
          });

          const event = new ChallengeDeneutralized({ certificationCourseId: 789, juryId: 7 });
          const certificationAssessment = new CertificationAssessment({
            id: 123,
            userId: 123,
            certificationCourseId: 789,
            createdAt: new Date('2020-01-01'),
            completedAt: new Date('2020-01-01'),
            state: CertificationAssessment.states.ENDED_BY_SUPERVISOR,
            version: 2,
            certificationChallenges: [
              domainBuilder.buildCertificationChallengeWithType({ isNeutralized: false }),
              domainBuilder.buildCertificationChallengeWithType({ isNeutralized: false }),
              domainBuilder.buildCertificationChallengeWithType({ isNeutralized: false }),
            ],
            certificationAnswersByDate: ['answer'],
          });
          const competenceMark1 = domainBuilder.buildCompetenceMark({ score: 0 });
          const competenceMark2 = domainBuilder.buildCompetenceMark({ score: 0 });
          const competenceMark3 = domainBuilder.buildCompetenceMark({ score: 0 });
          const certificationAssessmentScore = domainBuilder.buildCertificationAssessmentScore({
            competenceMarks: [competenceMark1, competenceMark2, competenceMark3],
            percentageCorrectAnswers: 33,
            hasEnoughNonNeutralizedChallengesToBeTrusted: true,
          });

          certificationAssessmentRepository.getByCertificationCourseId
            .withArgs({ certificationCourseId: 789 })
            .resolves(certificationAssessment);

          complementaryCertificationScoringCriteriaRepository.findByCertificationCourseId
            .withArgs({ certificationCourseId: 789 })
            .resolves([]);

          services.handleV2CertificationScoring.resolves({
            certificationCourse,
            certificationAssessmentScore,
          });
          scoringCertificationService.isLackOfAnswersForTechnicalReason.resolves(false);
          certificationCourseRepository.update.resolves(certificationCourse);

          // when
          await handleCertificationRescoring({
            event,
            ...dependencies,
          });

          // then
          const expectedCertificationCourse = domainBuilder.buildCertificationCourse({
            id: 789,
            isRejectedForFraud: false,
          });
          expect(certificationCourseRepository.update).to.have.been.calledWithExactly({
            certificationCourse: expectedCertificationCourse,
          });
        });

        context('when the candidate encountered a technical issue during certification', function () {
          it('cancels the certification', async function () {
            // given
            const certificationCourse = domainBuilder.buildCertificationCourse({
              id: 789,
              abortReason: ABORT_REASONS.TECHNICAL,
            });

            const event = new ChallengeDeneutralized({ certificationCourseId: 789, juryId: 7 });
            const certificationAssessment = new CertificationAssessment({
              id: 123,
              userId: 123,
              certificationCourseId: 789,
              createdAt: new Date('2020-01-01'),
              completedAt: new Date('2020-01-01'),
              state: CertificationAssessment.states.ENDED_BY_SUPERVISOR,
              version: 2,
              certificationChallenges: [domainBuilder.buildCertificationChallengeWithType({ isNeutralized: false })],
              certificationAnswersByDate: ['answer'],
            });
            const certificationAssessmentScore = domainBuilder.buildCertificationAssessmentScore({
              percentageCorrectAnswers: 33,
              hasEnoughNonNeutralizedChallengesToBeTrusted: true,
            });

            certificationAssessmentRepository.getByCertificationCourseId
              .withArgs({ certificationCourseId: 789 })
              .resolves(certificationAssessment);

            complementaryCertificationScoringCriteriaRepository.findByCertificationCourseId
              .withArgs({ certificationCourseId: 789 })
              .resolves([]);

            services.handleV2CertificationScoring.resolves({
              certificationCourse,
              certificationAssessmentScore,
            });
            scoringCertificationService.isLackOfAnswersForTechnicalReason.resolves(true);
            certificationCourseRepository.update.resolves(certificationCourse);

            // when
            await handleCertificationRescoring({
              event,
              ...dependencies,
            });

            // then
            const expectedCertificationCourse = domainBuilder.buildCertificationCourse({
              id: 789,
              isRejectedForFraud: false,
              abortReason: ABORT_REASONS.TECHNICAL,
              isCancelled: true,
            });
            expect(certificationCourseRepository.update).to.have.been.calledWithExactly({
              certificationCourse: expectedCertificationCourse,
            });
          });
        });
      });
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
        await handleCertificationRescoring({
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
        await handleCertificationRescoring({
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
        services.handleV2CertificationScoring.resolves({
          certificationCourse,
          certificationAssessmentScore: {},
        });
        scoringCertificationService.isLackOfAnswersForTechnicalReason.resolves(false);
        certificationCourseRepository.update.resolves(certificationCourse);
        const complementaryCertificationScoringCriteria = domainBuilder.buildComplementaryCertificationScoringCriteria({
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
        await handleCertificationRescoring({
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
