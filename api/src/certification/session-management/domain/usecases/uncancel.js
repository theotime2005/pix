/**
 * @typedef {import('./index.js').CertificationCourseRepository} CertificationCourseRepository
 * @typedef {import('./index.js').CertificationRescoringRepository} CertificationRescoringRepository
 * @typedef {import('./index.js').SessionRepository} SessionRepository
 */

import { NotFinalizedSessionError } from '../../../../shared/domain/errors.js';
import CertificationUncancelled from '../../../../shared/domain/events/CertificationUncancelled.js';

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

  certificationCourse.uncancel();
  await certificationCourseRepository.update({ certificationCourse });

  const event = new CertificationUncancelled({
    certificationCourseId: certificationCourse.getId(),
    juryId,
  });

  return certificationRescoringRepository.execute({ event });
};
