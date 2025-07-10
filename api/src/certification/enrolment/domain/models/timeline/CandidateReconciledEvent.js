// @ts-check
import { TimelineEvent } from './TimelineEvent.js';

export class CandidateReconciledEvent extends TimelineEvent {
  /**
   * @param {Object} props
   * @param {Date} props.when
   */
  constructor({ when }) {
    super({ code: CandidateReconciledEvent.name, when });
  }
}
