// @ts-check
/**
 * @typedef {import ('./index.js').CandidateRepository} CandidateRepository
 * @typedef {import ('./index.js').CertificationCourseRepository} CertificationCourseRepository
 * @typedef {import ('./index.js').PlacementProfileService} PlacementProfileService
 * @typedef {import ('../models/timeline/TimelineEvent.js').TimelineEvent} TimelineEvent
 * @typedef {import ('../models/Candidate.js').Candidate} Candidate
 */

import { LOCALE } from '../../../../shared/domain/constants.js';
import { CandidateCreatedEvent } from '../models/timeline/CandidateCreatedEvent.js';
import { CertificationNotCertifiableEvent } from '../models/timeline/CandidateNotCertifiableEvent.js';
import { CandidateReconciledEvent } from '../models/timeline/CandidateReconciledEvent.js';
import { CandidateTimeline } from '../models/timeline/CandidateTimeline.js';
import { CertificationStartedEvent } from '../models/timeline/CertificationStartedEvent.js';

/**
 * @param {Object} params
 * @param {number} params.sessionId
 * @param {number} params.certificationCandidateId
 * @param {CandidateRepository} params.candidateRepository
 * @param {CertificationCourseRepository} params.certificationCourseRepository
 * @param {PlacementProfileService} params.placementProfileService
 * @returns {Promise<CandidateTimeline>}
 */
export const getCandidateTimeline = async ({
  sessionId,
  certificationCandidateId,
  candidateRepository,
  certificationCourseRepository,
  placementProfileService,
}) => {
  const timeline = new CandidateTimeline({ sessionId, certificationCandidateId });

  const candidate = await candidateRepository.get({ certificationCandidateId });
  timeline.addEvent(new CandidateCreatedEvent({ when: candidate.createdAt }));

  if (!candidate.isReconciled()) {
    return timeline;
  }
  timeline.addEvent(new CandidateReconciledEvent({ when: candidate.reconciledAt }));

  const certificationCourse = await certificationCourseRepository.findOneCertificationCourseByUserIdAndSessionId({
    userId: candidate.userId,
    sessionId,
  });

  if (!certificationCourse) {
    const events = await _whenCandidateDidNotStartCertification({ candidate, placementProfileService });
    events.forEach((event) => timeline.addEvent(event));
    return timeline;
  }

  timeline.addEvent(new CertificationStartedEvent({ when: certificationCourse.getStartDate() }));

  return timeline;
};

/**
 * @param {Object} params
 * @param {Candidate} params.candidate
 * @param {PlacementProfileService} params.placementProfileService
 * @returns {Promise<Array<TimelineEvent>>}
 */
const _whenCandidateDidNotStartCertification = async ({ candidate, placementProfileService }) => {
  const placementProfile = await placementProfileService.getPlacementProfile({
    userId: candidate.userId,
    limitDate: candidate.reconciledAt,
    locale: LOCALE.FRENCH_FRANCE,
  });

  if (!placementProfile.isCertifiable()) {
    return [new CertificationNotCertifiableEvent({ when: candidate.reconciledAt })];
  }

  return [];
};
