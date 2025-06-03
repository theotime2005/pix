import { CertificationCourseUnrejected } from '../../../../shared/domain/events/CertificationCourseUnrejected.js';

export const unrejectCertificationCourse = async ({ certificationCourseId, juryId, certificationCourseRepository }) => {
  const certificationCourse = await certificationCourseRepository.get({ id: certificationCourseId });

  certificationCourse.unrejectForFraud();

  await certificationCourseRepository.update({ certificationCourse });

  // TODO : change this line to call the certification-rescoring-repository
  return new CertificationCourseUnrejected({ certificationCourseId, juryId });
};
