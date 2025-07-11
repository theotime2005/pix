// @ts-check
/**
 * @typedef {import ('./index.js').CandidateRepository} CandidateRepository
 * @typedef {import ('./index.js').CertificationCourseRepository} CertificationCourseRepository
 * @typedef {import ('./index.js').PlacementProfileService} PlacementProfileService
 * @typedef {import ('./index.js').CertificationBadgesService} CertificationBadgesService
 * @typedef {import ('./index.js').CertificationAssessmentRepository} CertificationAssessmentRepository
 * @typedef {import ('../models/timeline/TimelineEvent.js').TimelineEvent} TimelineEvent
 * @typedef {import ('../models/Candidate.js').Candidate} Candidate
 * @typedef {import ('../../../shared/domain/models/CertificationCourse.js').CertificationCourse} CertificationCourse
 * @typedef {import ('../../../session-management/domain/models/CertificationAssessment.js').CertificationAssessment} CertificationAssessment
 */

import { LOCALE } from '../../../../shared/domain/constants.js';
import { CandidateCreatedEvent } from '../models/timeline/CandidateCreatedEvent.js';
import { CandidateEndScreenEvent } from '../models/timeline/CandidateEndScreenEvent.js';
import { CertificationNotCertifiableEvent } from '../models/timeline/CandidateNotCertifiableEvent.js';
import { CandidateReconciledEvent } from '../models/timeline/CandidateReconciledEvent.js';
import { CandidateTimeline } from '../models/timeline/CandidateTimeline.js';
import { CertificationEndedEvent } from '../models/timeline/CertificationEndedEvent.js';
import { CertificationStartedEvent } from '../models/timeline/CertificationStartedEvent.js';
import { ComplementaryCertifiableEvent } from '../models/timeline/ComplementaryCertifiableEvent.js';
import { ComplementaryNotCertifiableEvent } from '../models/timeline/ComplementaryNotCertifiableEvent.js';

/**
 * @param {Object} params
 * @param {number} params.sessionId
 * @param {number} params.certificationCandidateId
 * @param {CandidateRepository} params.candidateRepository
 * @param {CertificationCourseRepository} params.certificationCourseRepository
 * @param {CertificationAssessmentRepository} params.certificationAssessmentRepository
 * @param {CertificationBadgesService} params.certificationBadgesService
 * @param {PlacementProfileService} params.placementProfileService
 * @returns {Promise<CandidateTimeline>}
 */
export const getCandidateTimeline = async ({
  sessionId,
  certificationCandidateId,
  candidateRepository,
  certificationCourseRepository,
  certificationAssessmentRepository,
  certificationBadgesService,
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

  const events = await _whenCandidateHasStartedTheTest({ candidate, certificationCourse, certificationBadgesService });
  events.forEach((event) => timeline.addEvent(event));

  if (certificationCourse.isCompleted()) {
    timeline.addEvent(new CandidateEndScreenEvent({ when: certificationCourse._completedAt }));
    return timeline;
  }

  const assessment = await certificationAssessmentRepository.getByCertificationCandidateId({
    certificationCandidateId,
  });
  if (assessment.endedAt) {
    timeline.addEvent(new CertificationEndedEvent({ when: assessment.endedAt, assessmentState: assessment.state }));
  }

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
/**
 * @param {Object} params
 * @param {Candidate} params.candidate
 * @param {CertificationCourse} params.certificationCourse
 * @param {CertificationBadgesService} params.certificationBadgesService
 * @returns {Promise<Array<TimelineEvent>>}
 */
const _whenCandidateHasStartedTheTest = async ({ candidate, certificationCourse, certificationBadgesService }) => {
  const events = [new CertificationStartedEvent({ when: certificationCourse.getStartDate() })];

  const onlyCoreSubscription = () => candidate.hasCoreSubscription() && candidate.subscriptions.length === 1;
  if (onlyCoreSubscription()) {
    return events;
  }

  const highestCertifiableBadgeAcquisitions = await certificationBadgesService.findStillValidBadgeAcquisitions({
    userId: certificationCourse.getUserId(),
    limitDate: certificationCourse.getStartDate(),
  });

  const findBadge = (subscription) => {
    return highestCertifiableBadgeAcquisitions.find(
      (badge) => subscription.complementaryCertificationId === badge.complementaryCertificationId,
    );
  };
  candidate.subscriptions
    .filter((subscription) => subscription.isComplementary())
    .forEach((subscription) => {
      const badge = findBadge(subscription);
      if (badge) {
        events.push(
          new ComplementaryCertifiableEvent({
            when: certificationCourse.getStartDate(),
            complementaryCertificationKey: badge.complementaryCertificationKey,
          }),
        );
      } else {
        events.push(
          new ComplementaryNotCertifiableEvent({
            when: certificationCourse.getStartDate(),
            complementaryCertificationId: subscription.complementaryCertificationId,
          }),
        );
      }
    });

  return events;
};
