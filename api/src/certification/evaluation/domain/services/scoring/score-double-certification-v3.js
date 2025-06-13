/**
 * @typedef {import('../index.js').CertificationCourseRepository} CertificationCourseRepository
 * @typedef {import('../index.js').AssessmentResultRepository} AssessmentResultRepository
 * @typedef {import('../index.js').ComplementaryCertificationScoringCriteriaRepository} ComplementaryCertificationScoringCriteriaRepository
 * @typedef {import('../index.js').ComplementaryCertificationCourseResultRepository} ComplementaryCertificationCourseResultRepository
 */
import { NotImplementedError } from '../../../../../shared/domain/errors.js';
import { logger } from '../../../../../shared/infrastructure/utils/logger.js';
import { ComplementaryCertificationCourseResult } from '../../../../shared/domain/models/ComplementaryCertificationCourseResult.js';
import {ComplementaryCertificationScoringWithoutComplementaryReferential} from '../../models/ComplementaryCertificationScoringWithoutComplementaryReferential.js';

/**
 * @param {Object} params
 * @param {number} params.certificationCourseId
 * @param {CertificationCourseRepository} params.certificationCourseRepository
 * @param {AssessmentResultRepository} params.assessmentResultRepository
 * @param {ComplementaryCertificationScoringCriteriaRepository} params.complementaryCertificationScoringCriteriaRepository
 * @param {ComplementaryCertificationCourseResultRepository} params.complementaryCertificationCourseResultRepository
 */
export const scoreDoubleCertificationV3 = async ({
  certificationCourseId,
  certificationCourseRepository,
  assessmentResultRepository,
  complementaryCertificationScoringCriteriaRepository,
  complementaryCertificationCourseResultRepository,
}) => {
  const certificationCourse = await certificationCourseRepository.get({ id: certificationCourseId });
  const scoringCriterias = await complementaryCertificationScoringCriteriaRepository.findByCertificationCourseId({
    certificationCourseId: certificationCourse.getId(),
  });

  if (!scoringCriterias.length) {
    logger.debug(`Certification [${certificationCourse.getId()}] is a Pix Core subscription`);
    return;
  }

  const {
    minimumReproducibilityRate,
    complementaryCertificationCourseId,
    complementaryCertificationBadgeId,
    hasComplementaryReferential,
    minimumEarnedPix,
  } = scoringCriterias[0];

  if (hasComplementaryReferential) {
    throw new NotImplementedError(`Certification [${certificationCourse.getId()}] is not a double certification`);
  }

  const assessmentResult = await assessmentResultRepository.getByCertificationCourseId({ certificationCourseId });

  const doubleCertificationScoring = new ComplementaryCertificationScoringWithoutComplementaryReferential({
    complementaryCertificationCourseId,
    complementaryCertificationBadgeId,
    reproducibilityRate: assessmentResult.reproducibilityRate,
    pixScore: assessmentResult.pixScore,
    minimumEarnedPix,
    hasAcquiredPixCertification: assessmentResult.isValidated(),
    minimumReproducibilityRate,
    isRejectedForFraud: certificationCourse.isRejectedForFraud(),
  });

  await complementaryCertificationCourseResultRepository.save(
    ComplementaryCertificationCourseResult.from({
      complementaryCertificationCourseId: doubleCertificationScoring.complementaryCertificationCourseId,
      complementaryCertificationBadgeId: doubleCertificationScoring.complementaryCertificationBadgeId,
      source: doubleCertificationScoring.source,
      acquired: doubleCertificationScoring.isAcquired(),
    }),
  );
};
