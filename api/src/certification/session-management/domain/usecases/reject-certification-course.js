import { CertificationCourseRejected } from '../events/CertificationCourseRejected.js';

export const rejectCertificationCourse = async ({
  certificationCourseId,
  juryId,
  certificationCourseRepository,
  certificationRescoringRepository,
}) => {
  const certificationCourse = await certificationCourseRepository.get({ id: certificationCourseId });
  certificationCourse.rejectForFraud();
  await certificationCourseRepository.update({ certificationCourse });

  await certificationRescoringRepository.execute({
    event: new CertificationCourseRejected({ certificationCourseId, juryId }),
  });
};
