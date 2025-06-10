/**
 * // TODO: cross bounded-context violation
 * @typedef {import('../../../session-management/domain/models/CertificationAssessment.js').CertificationAssessment} CertificationAssessment
 * @typedef {import('./index.js').Services} Services
 * @typedef {import('./index.js').CertificationCourseRepository} CertificationCourseRepository
 */

/**
 * @param {Object} params
 * @param {CertificationAssessment} params.certificationAssessment
 * @param {string} params.locale
 * @param {CertificationCourseRepository} params.certificationCourseRepository
 * @param {Services} params.services
 */
export const scoreCompletedV3Certification = async ({
  certificationAssessment,
  locale,
  certificationCourseRepository,
  services,
}) => {
  if (certificationAssessment.isScoringBlockedDueToComplementaryOnlyChallenges) {
    return;
  }

  const certificationCourse = await services.handleV3CertificationScoring({
    certificationAssessment,
    locale,
    dependencies: { findByCertificationCourseIdAndAssessmentId: services.findByCertificationCourseIdAndAssessmentId },
  });

  certificationCourse.complete({ now: new Date() });
  return certificationCourseRepository.update({ certificationCourse });
};
