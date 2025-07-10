// @ts-check
/**
 * @typedef {import ('./index.js').CandidateRepository} CandidateRepository
 */

import { CandidateCreatedEvent } from '../models/timeline/CandidateCreatedEvent.js';
import { CandidateReconciledEvent } from '../models/timeline/CandidateReconciledEvent.js';
import { CandidateTimeline } from '../models/timeline/CandidateTimeline.js';

/**
 * @param {Object} params
 * @param {number} params.sessionId
 * @param {number} params.certificationCandidateId
 * @param {CandidateRepository} params.candidateRepository
 * @returns {Promise<CandidateTimeline>}
 */
export const getCandidateTimeline = async ({ sessionId, certificationCandidateId, candidateRepository }) => {
  const timeline = new CandidateTimeline({ sessionId, certificationCandidateId });

  const candidate = await candidateRepository.get({ certificationCandidateId });
  timeline.addEvent(new CandidateCreatedEvent({ when: candidate.createdAt }));

  if (candidate.isReconciled()) {
    timeline.addEvent(new CandidateReconciledEvent({ when: candidate.reconciledAt }));
  }

  return timeline;
};
