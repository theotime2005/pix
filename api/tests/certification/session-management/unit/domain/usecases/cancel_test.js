import { cancel } from '../../../../../../src/certification/session-management/domain/usecases/cancel.js';
import { AlgorithmEngineVersion } from '../../../../../../src/certification/shared/domain/models/AlgorithmEngineVersion.js';
import { NotFinalizedSessionError } from '../../../../../../src/shared/domain/errors.js';
import CertificationCancelled from '../../../../../../src/shared/domain/events/CertificationCancelled.js';
import { catchErr, domainBuilder, expect, sinon } from '../../../../../test-helper.js';

describe('Certification | Session-management | Unit | Domain | UseCases | cancel', function () {
  describe('when it is a v2 certification', function () {
    describe('when session is finalized', function () {
      it('should cancel the certification', async function () {
        // given
        const juryId = 123;
        const session = domainBuilder.certification.sessionManagement.buildSession({
          finalizedAt: new Date('2020-01-01'),
          version: AlgorithmEngineVersion.V2,
        });
        const certificationCourse = domainBuilder.buildCertificationCourse({
          id: 123,
          sessionId: session.id,
          version: AlgorithmEngineVersion.V2,
        });
        const certificationCourseRepository = {
          get: sinon.stub(),
        };
        const sessionRepository = {
          get: sinon.stub(),
        };
        const certificationRescoringRepository = {
          rescoreV2Certification: sinon.stub(),
        };
        certificationCourseRepository.get.withArgs({ id: 123 }).resolves(certificationCourse);
        certificationRescoringRepository.rescoreV2Certification.resolves();
        sessionRepository.get.withArgs({ id: certificationCourse.getSessionId() }).resolves(session);

        // when
        await cancel({
          certificationCourseId: 123,
          juryId,
          certificationCourseRepository,
          sessionRepository,
          certificationRescoringRepository,
        });

        // then
        expect(certificationRescoringRepository.rescoreV2Certification).to.have.been.calledWithExactly({
          event: new CertificationCancelled({
            certificationCourseId: certificationCourse.getId(),
            juryId,
          }),
        });
      });
    });

    describe('when session is not finalized', function () {
      it('should not cancel the certification', async function () {
        // given
        const juryId = 123;
        const session = domainBuilder.certification.sessionManagement.buildSession({
          finalizedAt: null,
          version: AlgorithmEngineVersion.V2,
        });
        const certificationCourse = domainBuilder.buildCertificationCourse({
          id: 123,
          sessionId: session.id,
          version: AlgorithmEngineVersion.V2,
        });
        const certificationCourseRepository = {
          get: sinon.stub(),
        };
        const sessionRepository = {
          get: sinon.stub(),
        };
        certificationCourseRepository.get.withArgs({ id: 123 }).resolves(certificationCourse);
        sessionRepository.get.withArgs({ id: certificationCourse.getSessionId() }).resolves(session);

        // when
        const error = await catchErr(cancel)({
          certificationCourseId: 123,
          certificationCourseRepository,
          sessionRepository,
          juryId,
        });

        // then
        expect(error).to.be.instanceOf(NotFinalizedSessionError);
      });
    });
  });

  describe('when it is a v3 certification', function () {
    describe('when session is finalized', function () {
      it('should cancel the certification', async function () {
        // given
        const juryId = 123;
        const session = domainBuilder.certification.sessionManagement.buildSession({
          finalizedAt: new Date('2020-01-01'),
          version: AlgorithmEngineVersion.V3,
        });
        const certificationCourse = domainBuilder.buildCertificationCourse({
          id: 123,
          sessionId: session.id,
          version: AlgorithmEngineVersion.V3,
        });
        const certificationCourseRepository = {
          get: sinon.stub(),
        };
        const sessionRepository = {
          get: sinon.stub(),
        };
        const certificationRescoringRepository = {
          rescoreV3Certification: sinon.stub(),
        };
        certificationCourseRepository.get.withArgs({ id: 123 }).resolves(certificationCourse);
        certificationRescoringRepository.rescoreV3Certification.resolves();
        sessionRepository.get.withArgs({ id: certificationCourse.getSessionId() }).resolves(session);

        // when
        await cancel({
          certificationCourseId: 123,
          juryId,
          certificationCourseRepository,
          sessionRepository,
          certificationRescoringRepository,
        });

        // then
        expect(certificationRescoringRepository.rescoreV3Certification).to.have.been.calledWithExactly({
          event: new CertificationCancelled({
            certificationCourseId: certificationCourse.getId(),
            juryId,
          }),
        });
      });
    });

    describe('when session is not finalized', function () {
      it('should not cancel the certification', async function () {
        // given
        const juryId = 123;
        const session = domainBuilder.certification.sessionManagement.buildSession({
          finalizedAt: null,
          version: AlgorithmEngineVersion.V3,
        });
        const certificationCourse = domainBuilder.buildCertificationCourse({
          id: 123,
          sessionId: session.id,
          version: AlgorithmEngineVersion.V3,
        });
        const certificationCourseRepository = {
          get: sinon.stub(),
        };
        const sessionRepository = {
          get: sinon.stub(),
        };
        certificationCourseRepository.get.withArgs({ id: 123 }).resolves(certificationCourse);
        sessionRepository.get.withArgs({ id: certificationCourse.getSessionId() }).resolves(session);

        // when
        const error = await catchErr(cancel)({
          certificationCourseId: 123,
          certificationCourseRepository,
          sessionRepository,
          juryId,
        });

        // then
        expect(error).to.be.instanceOf(NotFinalizedSessionError);
      });
    });
  });
});
