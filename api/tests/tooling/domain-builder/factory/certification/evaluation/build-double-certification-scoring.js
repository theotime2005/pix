import { DoubleCertificationScoring } from '../../../../../../src/certification/evaluation/domain/models/DoubleCertificationScoring.js';

export const buildDoubleCertificationScoring = function ({
  complementaryCertificationCourseId = 99,
  complementaryCertificationBadgeId = 60,
  certificationCourseId = 42,
  reproducibilityRate = 50,
  pixScore,
  minimumEarnedPix,
  minimumReproducibilityRate,
  hasAcquiredPixCertification = true,
} = {}) {
  return new DoubleCertificationScoring({
    complementaryCertificationCourseId,
    complementaryCertificationBadgeId,
    certificationCourseId,
    reproducibilityRate,
    pixScore,
    minimumEarnedPix,
    minimumReproducibilityRate,
    hasAcquiredPixCertification,
  });
};
