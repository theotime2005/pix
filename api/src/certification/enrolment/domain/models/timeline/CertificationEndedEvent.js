// @ts-check
/**
 * @typedef {import ('../../../../session-management/domain/models/CertificationAssessment.js').states} states
 */
import { TimelineEvent } from './TimelineEvent.js';

export class CertificationEndedEvent extends TimelineEvent {
  /**
   * @param {Object} props
   * @param {Date} props.when
   * @param {states} props.assessmentState
   */
  constructor({ when, assessmentState }) {
    super({ code: CertificationEndedEvent.name, when, metadata: { assessmentState } });
  }
}
