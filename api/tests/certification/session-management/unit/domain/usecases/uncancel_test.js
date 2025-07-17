import { uncancel } from '../../../../../../src/certification/session-management/domain/usecases/uncancel.js';
import { AlgorithmEngineVersion } from '../../../../../../src/certification/shared/domain/models/AlgorithmEngineVersion.js';
import { NotFinalizedSessionError } from '../../../../../../src/shared/domain/errors.js';
import CertificationUncancelled from '../../../../../../src/shared/domain/events/CertificationUncancelled.js';
import { catchErr, domainBuilder, expect, sinon } from '../../../../../test-helper.js';

describe('Certification | Session-management | Unit | Domain | UseCases | uncancel', function () {
  describe('when certification is a V2', function () {
    it('should uncancel the certification', async function () {
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
      const certificationRescoringRepository = {
        rescoreV2Certification: sinon.stub(),
      };
      const sessionRepository = {
        get: sinon.stub(),
      };
      certificationCourseRepository.get.withArgs({ id: 123 }).resolves(certificationCourse);
      certificationRescoringRepository.rescoreV2Certification.resolves();
      sessionRepository.get.withArgs({ id: certificationCourse.getSessionId() }).resolves(session);

      // when
      await uncancel({
        certificationCourseId: 123,
        juryId,
        certificationCourseRepository,
        certificationRescoringRepository,
        sessionRepository,
      });

      // then
      expect(certificationRescoringRepository.rescoreV2Certification).to.have.been.calledWithExactly({
        event: new CertificationUncancelled({
          certificationCourseId: certificationCourse.getId(),
          juryId,
        }),
      });
    });

    describe('when session is not finalized', function () {
      it('should not uncancel the certification', async function () {
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
        const error = await catchErr(uncancel)({
          juryId,
          certificationCourseId: 123,
          certificationCourseRepository,
          sessionRepository,
        });

        // then
        expect(error).to.be.instanceOf(NotFinalizedSessionError);
      });
    });
  });

  describe('when certification is a V3', function () {
    it('should uncancel the certification', async function () {
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
      const certificationRescoringRepository = {
        rescoreV3Certification: sinon.stub(),
      };
      const sessionRepository = {
        get: sinon.stub(),
      };
      certificationCourseRepository.get.withArgs({ id: 123 }).resolves(certificationCourse);
      certificationRescoringRepository.rescoreV3Certification.resolves();
      sessionRepository.get.withArgs({ id: certificationCourse.getSessionId() }).resolves(session);

      // when
      await uncancel({
        certificationCourseId: 123,
        juryId,
        certificationCourseRepository,
        certificationRescoringRepository,
        sessionRepository,
      });

      // then
      expect(certificationRescoringRepository.rescoreV3Certification).to.have.been.calledWithExactly({
        event: new CertificationUncancelled({
          certificationCourseId: certificationCourse.getId(),
          juryId,
        }),
      });
    });

    describe('when session is not finalized', function () {
      it('should not uncancel the certification', async function () {
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
        const error = await catchErr(uncancel)({
          juryId,
          certificationCourseId: 123,
          certificationCourseRepository,
          sessionRepository,
        });

        // then
        expect(error).to.be.instanceOf(NotFinalizedSessionError);
      });
    });
  });
});
