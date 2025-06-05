import { CertificationCourseUnrejected } from '../../../../shared/domain/events/CertificationCourseUnrejected.js';

export const unrejectCertificationCourse = async ({
  certificationCourseId,
  juryId,
  certificationCourseRepository,
  certificationRescoringRepository,
}) => {
  const certificationCourse = await certificationCourseRepository.get({ id: certificationCourseId });
  certificationCourse.unrejectForFraud();
  await certificationCourseRepository.update({ certificationCourse });

  await certificationRescoringRepository.execute({
    event: new CertificationCourseUnrejected({ certificationCourseId, juryId }),
  });
};
