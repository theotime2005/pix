/**
 * @typedef {import('./index.js').CertificationCourseRepository} CertificationCourseRepository
 * @typedef {import('./index.js').SessionRepository} SessionRepository
 * @typedef {import('./index.js').CertificationRescoringRepository} CertificationRescoringRepository
 */

import CertificationCancelled from '../../../../../src/shared/domain/events/CertificationCancelled.js';
import { NotFinalizedSessionError } from '../../../../shared/domain/errors.js';

/**
 * @param {Object} params
 * @param {number} params.certificationCourseId
 * @param {CertificationCourseRepository} params.certificationCourseRepository
 * @param {SessionRepository} params.sessionRepository
 * @param {CertificationRescoringRepository} params.certificationRescoringRepository
 */
export const cancel = async function ({
  certificationCourseId,
  juryId,
  certificationCourseRepository,
  sessionRepository,
  certificationRescoringRepository,
}) {
  const certificationCourse = await certificationCourseRepository.get({ id: certificationCourseId });
  const session = await sessionRepository.get({ id: certificationCourse.getSessionId() });
  if (!session.isFinalized) {
    throw new NotFinalizedSessionError();
  }

  const event = new CertificationCancelled({
    certificationCourseId,
    juryId,
  });

  await certificationRescoringRepository.execute({ event });

  // Note: update after event to ensure we doing it well, even when rescoring. Needeed this only for v2 certification
  certificationCourse.cancel();
  await certificationCourseRepository.update({ certificationCourse });
};
