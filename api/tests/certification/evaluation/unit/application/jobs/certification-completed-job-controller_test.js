import { CertificationCompletedJobController } from '../../../../../../src/certification/evaluation/application/jobs/certification-completed-job-controller.js';
import { CertificationCompletedJob } from '../../../../../../src/certification/evaluation/domain/events/CertificationCompleted.js';
import { usecases } from '../../../../../../src/certification/evaluation/domain/usecases/index.js';
import { AlgorithmEngineVersion } from '../../../../../../src/certification/shared/domain/models/AlgorithmEngineVersion.js';
import {
  ABORT_REASONS,
  CertificationCourse,
} from '../../../../../../src/certification/shared/domain/models/CertificationCourse.js';
import { domainBuilder, expect, sinon } from '../../../../../test-helper.js';

describe('Unit | Certification | Application | jobs | CertificationCompletedJobController', function () {
  let certificationCompletedJobController;
  let certificationAssessmentRepository;
  let assessmentResultRepository;
  let certificationCourseRepository;
  let scoringConfigurationRepository;
  let competenceMarkRepository;
  let answerRepository;
  let flashAlgorithmConfigurationRepository;
  let flashAlgorithmService;
  let certificationChallengeRepository;
  let certificationAssessmentHistoryRepository;
  let services;

  let now;
  let clock;

  beforeEach(function () {
    clock = sinon.useFakeTimers({ now: new Date('2019-01-01T05:06:07Z'), toFake: ['Date'] });
    now = new Date(clock.now);

    certificationCompletedJobController = new CertificationCompletedJobController();

    services = {
      handleV2CertificationScoring: sinon.stub(),
      handleV3CertificationScoring: sinon.stub(),
      scoreComplementaryCertificationV2: sinon.stub(),
    };
    certificationAssessmentRepository = { get: sinon.stub() };
    assessmentResultRepository = { save: sinon.stub() };
    certificationCourseRepository = {
      get: sinon.stub(),
      update: sinon.stub(),
      getCreationDate: sinon.stub(),
    };
    scoringConfigurationRepository = { getLatestByDateAndLocale: sinon.stub() };
    competenceMarkRepository = { save: sinon.stub() };
    certificationChallengeRepository = { getByCertificationCourseId: sinon.stub() };
    answerRepository = { findByAssessment: sinon.stub() };
    flashAlgorithmConfigurationRepository = { getMostRecentBeforeDate: sinon.stub() };
    certificationAssessmentHistoryRepository = { save: sinon.stub() };
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
        certificationAssessmentRepository.get.withArgs(assessmentId).resolves(certificationAssessment);
      });

      it('should call the scoreCompletedV2Certification usecase', async function () {
        // given
        sinon.stub(usecases, 'scoreCompletedV2Certification');

        // when
        await certificationCompletedJobController.handle({
          data,
          dependencies: { certificationAssessmentRepository },
        });

        // then
        expect(usecases.scoreCompletedV2Certification).to.have.been.calledWithExactly({
          certificationAssessment,
        });
      });
    });

    // TODO: move to usecase unit
    context('when certification is V3', function () {
      let data;
      let certificationAssessment;
      let certificationCourse;
      const assessmentResultId = 99;
      const certificationCourseStartDate = new Date('2022-02-01');

      beforeEach(function () {
        data = new CertificationCompletedJob({
          assessmentId,
          userId,
          certificationCourseId: 123,
        });
        certificationAssessment = {
          id: assessmentId,
          certificationCourseId,
          userId,
          createdAt: Symbol('someCreationDate'),
          version: AlgorithmEngineVersion.V3,
        };
        certificationAssessmentRepository.get.withArgs(assessmentId).resolves(certificationAssessment);
        certificationCourse = domainBuilder.buildCertificationCourse({
          id: certificationCourseId,
          createdAt: certificationCourseStartDate,
          completedAt: null,
        });

        flashAlgorithmService = {
          getCapacityAndErrorRate: sinon.stub(),
          getCapacityAndErrorRateHistory: sinon.stub(),
        };

        const scoringConfiguration = domainBuilder.buildV3CertificationScoring({
          competencesForScoring: [domainBuilder.buildCompetenceForScoring()],
        });

        scoringConfigurationRepository.getLatestByDateAndLocale.resolves(scoringConfiguration);

        assessmentResultRepository.save.resolves(
          domainBuilder.buildAssessmentResult({
            id: assessmentResultId,
          }),
        );
      });

      describe('when less than the minimum number of answers required by the config has been answered', function () {
        describe('when the candidate did not finish due to a lack of time', function () {
          it('completes the certification', async function () {
            // given
            const abortedCertificationCourse = domainBuilder.buildCertificationCourse({
              id: certificationCourseId,
              createdAt: certificationCourseStartDate,
              abortReason: ABORT_REASONS.CANDIDATE,
            });

            services.handleV3CertificationScoring.resolves(abortedCertificationCourse);

            const dependencies = {
              certificationChallengeRepository,
              answerRepository,
              assessmentResultRepository,
              certificationCourseRepository,
              scoringConfigurationRepository,
              competenceMarkRepository,
              services,
              certificationAssessmentRepository,
              flashAlgorithmConfigurationRepository,
              flashAlgorithmService,
              certificationAssessmentHistoryRepository,
            };

            // when
            await certificationCompletedJobController.handle({ data, dependencies });

            // then
            expect(certificationCourseRepository.update).to.have.been.calledWithExactly({
              certificationCourse: new CertificationCourse({
                ...certificationCourse.toDTO(),
                completedAt: now,
                abortReason: ABORT_REASONS.CANDIDATE,
              }),
            });
          });
        });
      });

      describe('when at least the minimum number of answers required by the config has been answered', function () {
        describe('when the certification was completed', function () {
          it('completes the certification', async function () {
            // given
            const certificationCourse = domainBuilder.buildCertificationCourse({
              id: certificationCourseId,
              createdAt: certificationCourseStartDate,
              isCancelled: false,
              completedAt: null,
            });

            services.handleV3CertificationScoring.resolves(certificationCourse);

            const dependencies = {
              certificationChallengeRepository,
              answerRepository,
              assessmentResultRepository,
              certificationCourseRepository,
              scoringConfigurationRepository,
              competenceMarkRepository,
              services,
              certificationAssessmentRepository,
              flashAlgorithmConfigurationRepository,
              flashAlgorithmService,
              certificationAssessmentHistoryRepository,
            };

            // when
            await certificationCompletedJobController.handle({ data, dependencies });

            // then
            expect(certificationCourseRepository.update).to.have.been.calledWithExactly({
              certificationCourse: new CertificationCourse({
                ...certificationCourse.toDTO(),
                completedAt: now,
              }),
            });
          });
        });

        describe('when the certification was not completed', function () {
          describe('when the candidate did not finish due to technical difficulties', function () {
            it('completes the certification with the raw score', async function () {
              // given
              const abortReason = ABORT_REASONS.TECHNICAL;
              const certificationCourse = domainBuilder.buildCertificationCourse({
                id: certificationCourseId,
                createdAt: certificationCourseStartDate,
                isCancelled: false,
                completedAt: null,
                abortReason,
              });

              services.handleV3CertificationScoring.resolves(certificationCourse);

              const dependencies = {
                certificationChallengeRepository,
                answerRepository,
                assessmentResultRepository,
                certificationCourseRepository,
                scoringConfigurationRepository,
                competenceMarkRepository,
                services,
                certificationAssessmentRepository,
                flashAlgorithmConfigurationRepository,
                flashAlgorithmService,
                certificationAssessmentHistoryRepository,
              };

              // when
              await certificationCompletedJobController.handle({ data, dependencies });

              // then
              expect(certificationCourseRepository.update).to.have.been.calledWithExactly({
                certificationCourse: new CertificationCourse({
                  ...certificationCourse.toDTO(),
                  completedAt: now,
                  abortReason,
                }),
              });
            });
          });

          describe('when the candidate did not finish in time', function () {
            it('completes the certification', async function () {
              // given
              const abortReason = ABORT_REASONS.CANDIDATE;
              const certificationCourse = domainBuilder.buildCertificationCourse({
                id: certificationCourseId,
                createdAt: certificationCourseStartDate,
                isCancelled: false,
                completedAt: null,
                abortReason,
              });

              services.handleV3CertificationScoring.resolves(certificationCourse);

              const dependencies = {
                certificationChallengeRepository,
                answerRepository,
                assessmentResultRepository,
                certificationCourseRepository,
                scoringConfigurationRepository,
                competenceMarkRepository,
                services,
                certificationAssessmentRepository,
                flashAlgorithmConfigurationRepository,
                flashAlgorithmService,
                certificationAssessmentHistoryRepository,
              };

              // when
              await certificationCompletedJobController.handle({ data, dependencies });

              // then
              expect(certificationCourseRepository.update).to.have.been.calledWithExactly({
                certificationCourse: new CertificationCourse({
                  ...certificationCourse.toDTO(),
                  completedAt: now,
                  abortReason,
                }),
              });
            });
          });
        });
      });
    });
  });
});
