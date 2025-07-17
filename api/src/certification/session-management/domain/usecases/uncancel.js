/**
 * @typedef {import('./index.js').CertificationCourseRepository} CertificationCourseRepository
 * @typedef {import('./index.js').CertificationRescoringRepository} CertificationRescoringRepository
 * @typedef {import('./index.js').SessionRepository} SessionRepository
 */

import { NotFinalizedSessionError } from '../../../../shared/domain/errors.js';
import CertificationUncancelled from '../../../../shared/domain/events/CertificationUncancelled.js';
import { AlgorithmEngineVersion } from '../../../shared/domain/models/AlgorithmEngineVersion.js';

/**
 * @param {Object} params
 * @param {number} params.certificationCourseId
 * @param {number} params.juryId
 * @param {CertificationCourseRepository} params.certificationCourseRepository
 * @param {CertificationRescoringRepository} params.certificationRescoringRepository
 * @param {SessionRepository} params.SessionRepository
 */
export const uncancel = async function ({
  certificationCourseId,
  juryId,
  certificationCourseRepository,
  certificationRescoringRepository,
  sessionRepository,
}) {
  const certificationCourse = await certificationCourseRepository.get({ id: certificationCourseId });
  const session = await sessionRepository.get({ id: certificationCourse.getSessionId() });
  if (!session.isFinalized) {
    throw new NotFinalizedSessionError();
  }

  const event = new CertificationUncancelled({
    certificationCourseId: certificationCourse.getId(),
    juryId,
  });

  if (AlgorithmEngineVersion.isV3(certificationCourse.getVersion())) {
    return certificationRescoringRepository.rescoreV3Certification({ event });
  }

  if (AlgorithmEngineVersion.isV2(certificationCourse.getVersion())) {
    return certificationRescoringRepository.rescoreV2Certification({ event });
  }
};
