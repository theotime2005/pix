import { CertificationCourse } from '../../../../../../src/certification/shared/domain/models/CertificationCourse.js';
import { getCertificationCourse } from '../../../../../../src/certification/shared/domain/usecases/get-certification-course.js';
import { expect, sinon } from '../../../../../test-helper.js';

describe('Unit | UseCase | get-certification-course', function () {
  let certificationCourse;
  let certificationCourseRepository;

  beforeEach(function () {
    certificationCourse = new CertificationCourse({
      id: 'certification_course_id',
    });
    certificationCourseRepository = {
      get: sinon.stub(),
    };
  });

  it('should get the certificationCourse by its id', async function () {
    // given
    certificationCourseRepository.get
      .withArgs({ id: certificationCourse.getId(), verificationCode: undefined })
      .resolves(certificationCourse);

    // when
    const actualCertificationCourse = await getCertificationCourse({
      certificationCourseId: certificationCourse.getId(),
      certificationCourseRepository,
    });

    // then
    expect(actualCertificationCourse.getId()).to.equal(certificationCourse.getId());
  });

  it('should get the certificationCourse by its verification code', async function () {
    // given
    certificationCourseRepository.get
      .withArgs({ verificationCode: certificationCourse._verificationCode, id: undefined })
      .resolves(certificationCourse);

    // when
    const actualCertificationCourse = await getCertificationCourse({
      verificationCode: certificationCourse._verificationCode,
      certificationCourseRepository,
    });

    // then
    expect(actualCertificationCourse.getId()).to.equal(certificationCourse.getId());
  });
});
