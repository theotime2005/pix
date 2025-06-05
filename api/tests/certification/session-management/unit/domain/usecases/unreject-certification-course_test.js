import { unrejectCertificationCourse } from '../../../../../../src/certification/session-management/domain/usecases/unreject-certification-course.js';
import { CertificationCourse } from '../../../../../../src/certification/shared/domain/models/CertificationCourse.js';
import { CertificationCourseUnrejected } from '../../../../../../src/shared/domain/events/CertificationCourseUnrejected.js';
import { domainBuilder, expect, sinon } from '../../../../../test-helper.js';

describe('Unit | UseCase | unreject-certification-course', function () {
  it('should unreject a rejected certification course', async function () {
    // given
    const certificationCourseRepository = { get: sinon.stub(), update: sinon.stub() };
    const certificationRescoringRepository = { execute: sinon.stub() };
    const juryId = 123;

    const dependencies = {
      certificationCourseRepository,
      certificationRescoringRepository,
    };
    const certificationCourse = domainBuilder.buildCertificationCourse({
      isRejectedForFraud: true,
    });
    const certificationCourseId = certificationCourse.getId();

    certificationCourseRepository.get.withArgs({ id: certificationCourseId }).resolves(certificationCourse);
    certificationCourseRepository.update.resolves();
    certificationRescoringRepository.execute.resolves();

    // when
    await unrejectCertificationCourse({
      ...dependencies,
      juryId,
      certificationCourseId: certificationCourseId,
    });

    // then
    const expectedCertificationCourse = new CertificationCourse({
      ...certificationCourse.toDTO(),
      isRejectedForFraud: false,
    });

    expect(certificationCourseRepository.update).to.have.been.calledWithExactly({
      certificationCourse: expectedCertificationCourse,
    });
    expect(certificationRescoringRepository.execute).to.have.been.calledOnceWithExactly({
      event: new CertificationCourseUnrejected({
        certificationCourseId,
        juryId,
      }),
    });
  });
});
