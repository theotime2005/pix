import { scoreCompletedV3Certification } from '../../../../../../src/certification/evaluation/domain/usecases/score-completed-v3-certification.js';
import { AlgorithmEngineVersion } from '../../../../../../src/certification/shared/domain/models/AlgorithmEngineVersion.js';
import {
  ABORT_REASONS,
  CertificationCourse,
} from '../../../../../../src/certification/shared/domain/models/CertificationCourse.js';
import { DomainTransaction } from '../../../../../../src/shared/domain/DomainTransaction.js';
import { domainBuilder, expect, sinon } from '../../../../../test-helper.js';

describe('Unit | Certification | Evaluation | UseCases | scoreCompletedV3Certification', function () {
  let certificationCourseRepository;
  let services;

  let now;
  let clock;

  beforeEach(function () {
    sinon.stub(DomainTransaction, 'execute').callsFake((callback) => {
      return callback();
    });
    clock = sinon.useFakeTimers({ now: new Date('2019-01-01T05:06:07Z'), toFake: ['Date'] });
    now = new Date(clock.now);

    services = {
      handleV3CertificationScoring: sinon.stub(),
      scoreDoubleCertificationV3: sinon.stub().throws(new Error('Expected to be called')),
    };
    certificationCourseRepository = {
      get: sinon.stub(),
      update: sinon.stub(),
      getCreationDate: sinon.stub(),
    };
  });

  afterEach(function () {
    clock.restore();
  });

  context('when assessment is of type CERTIFICATION', function () {
    const assessmentId = 1214;
    const certificationCourseId = 1234;
    const userId = 4567;

    context('when certification is V3', function () {
      let certificationAssessment;
      let certificationCourse;
      const certificationCourseStartDate = new Date('2022-02-01');

      beforeEach(function () {
        certificationAssessment = {
          id: assessmentId,
          certificationCourseId,
          userId,
          createdAt: Symbol('someCreationDate'),
          version: AlgorithmEngineVersion.V3,
        };
        certificationCourse = domainBuilder.buildCertificationCourse({
          id: certificationCourseId,
          createdAt: certificationCourseStartDate,
          completedAt: null,
        });
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
            services.scoreDoubleCertificationV3.resolves();

            const dependencies = {
              certificationCourseRepository,
              services,
            };

            // when
            await scoreCompletedV3Certification({ certificationAssessment, ...dependencies });

            // then
            expect(certificationCourseRepository.update).to.have.been.calledWithExactly({
              certificationCourse: new CertificationCourse({
                ...certificationCourse.toDTO(),
                completedAt: now,
                abortReason: ABORT_REASONS.CANDIDATE,
              }),
            });
            expect(services.scoreDoubleCertificationV3).to.have.been.calledWithExactly({
              certificationCourseId: certificationCourse.getId(),
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
              completedAt: null,
            });

            services.handleV3CertificationScoring.resolves(certificationCourse);
            services.scoreDoubleCertificationV3.resolves();

            const dependencies = {
              certificationCourseRepository,
              services,
            };

            // when
            await scoreCompletedV3Certification({ certificationAssessment, ...dependencies });

            // then
            expect(certificationCourseRepository.update).to.have.been.calledWithExactly({
              certificationCourse: new CertificationCourse({
                ...certificationCourse.toDTO(),
                completedAt: now,
              }),
            });
            expect(services.scoreDoubleCertificationV3).to.have.been.calledWithExactly({
              certificationCourseId: certificationCourse.getId(),
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
                completedAt: null,
                abortReason,
              });

              services.handleV3CertificationScoring.resolves(certificationCourse);
              services.scoreDoubleCertificationV3.resolves(certificationCourse);

              const dependencies = {
                certificationCourseRepository,
                services,
              };

              // when
              await scoreCompletedV3Certification({ certificationAssessment, ...dependencies });

              // then
              expect(certificationCourseRepository.update).to.have.been.calledWithExactly({
                certificationCourse: new CertificationCourse({
                  ...certificationCourse.toDTO(),
                  completedAt: now,
                  abortReason,
                }),
              });
              expect(services.scoreDoubleCertificationV3).to.have.been.calledWithExactly({
                certificationCourseId: certificationCourse.getId(),
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
                completedAt: null,
                abortReason,
              });

              services.handleV3CertificationScoring.resolves(certificationCourse);
              services.scoreDoubleCertificationV3.resolves(certificationCourse);

              const dependencies = {
                certificationCourseRepository,
                services,
              };

              // when
              await scoreCompletedV3Certification({ certificationAssessment, ...dependencies });

              // then
              expect(certificationCourseRepository.update).to.have.been.calledWithExactly({
                certificationCourse: new CertificationCourse({
                  ...certificationCourse.toDTO(),
                  completedAt: now,
                  abortReason,
                }),
              });
              expect(services.scoreDoubleCertificationV3).to.have.been.calledWithExactly({
                certificationCourseId: certificationCourse.getId(),
              });
            });
          });
        });
      });
    });
  });
});
