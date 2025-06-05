import { CertificationCourseRejected } from '../../../../../../src/certification/session-management/domain/events/CertificationCourseRejected.js';
import { rejectCertificationCourse } from '../../../../../../src/certification/session-management/domain/usecases/reject-certification-course.js';
import { CertificationCourse } from '../../../../../../src/certification/shared/domain/models/CertificationCourse.js';
import { domainBuilder, expect, sinon } from '../../../../../test-helper.js';

describe('Unit | UseCase | reject-certification-course', function () {
  it('should reject a newly created assessment result', async function () {
    // given
    const certificationCourseRepository = { get: sinon.stub(), update: sinon.stub() };
    const certificationRescoringRepository = { execute: sinon.stub() };
    const juryId = 123;

    const dependencies = {
      certificationCourseRepository,
      certificationRescoringRepository,
    };
    const certificationCourse = domainBuilder.buildCertificationCourse();
    const certificationCourseId = certificationCourse.getId();

    certificationCourseRepository.get.withArgs({ id: certificationCourseId }).resolves(certificationCourse);
    certificationCourseRepository.update.resolves();
    certificationRescoringRepository.execute.resolves();

    // when
    await rejectCertificationCourse({
      ...dependencies,
      juryId,
      certificationCourseId: certificationCourseId,
    });

    // then
    const expectedCertificationCourse = new CertificationCourse({
      ...certificationCourse.toDTO(),
      isRejectedForFraud: true,
    });

    expect(certificationCourseRepository.update).to.have.been.calledWithExactly({
      certificationCourse: expectedCertificationCourse,
    });

    expect(certificationRescoringRepository.execute).to.have.been.calledOnceWithExactly({
      event: new CertificationCourseRejected({
        certificationCourseId,
        juryId,
      }),
    });
  });
});
