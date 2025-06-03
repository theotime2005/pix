import { CertificationCourseRejected } from '../events/CertificationCourseRejected.js';

export const rejectCertificationCourse = async ({ certificationCourseId, juryId, certificationCourseRepository }) => {
  const certificationCourse = await certificationCourseRepository.get({ id: certificationCourseId });

  certificationCourse.rejectForFraud();

  await certificationCourseRepository.update({ certificationCourse });

  // TODO : change this line to call the certification-rescoring-repository
  return new CertificationCourseRejected({ certificationCourseId, juryId });
};
