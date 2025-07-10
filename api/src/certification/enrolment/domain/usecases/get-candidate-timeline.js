// @ts-check
/**
 * @typedef {import ('./index.js').CandidateRepository} CandidateRepository
 * @typedef {import ('./index.js').CertificationCourseRepository} CertificationCourseRepository
 * @typedef {import ('./index.js').CertificationBadgesService} CertificationBadgesService
 */

import { CandidateCreatedEvent } from '../models/timeline/CandidateCreatedEvent.js';
import { CandidateReconciledEvent } from '../models/timeline/CandidateReconciledEvent.js';
import { CandidateTimeline } from '../models/timeline/CandidateTimeline.js';
import { CertificationStartedEvent } from '../models/timeline/CertificationStartedEvent.js';

/**
 * @param {Object} params
 * @param {number} params.sessionId
 * @param {number} params.certificationCandidateId
 * @param {CandidateRepository} params.candidateRepository
 * @param {CertificationCourseRepository} params.certificationCourseRepository
 * @param {CertificationBadgesService} params.certificationBadgesService
 * @returns {Promise<CandidateTimeline>}
 */
export const getCandidateTimeline = async ({
  sessionId,
  certificationCandidateId,
  candidateRepository,
  certificationCourseRepository,
  certificationBadgesService,
}) => {
  const timeline = new CandidateTimeline({ sessionId, certificationCandidateId });

  const candidate = await candidateRepository.get({ certificationCandidateId });
  timeline.addEvent(new CandidateCreatedEvent({ when: candidate.createdAt }));

  if (candidate.isReconciled()) {
    timeline.addEvent(new CandidateReconciledEvent({ when: candidate.reconciledAt }));
  }

  const certificationCourse = await certificationCourseRepository.findOneCertificationCourseByUserIdAndSessionId({
    userId: candidate.userId,
    sessionId,
  });

  if (!certificationCourse) {
    return timeline;
  }

  timeline.addEvent(new CertificationStartedEvent({ when: certificationCourse.getStartDate() }));

  return timeline;
};
