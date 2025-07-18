// @ts-check
import { TimelineEvent } from './TimelineEvent.js';

export class CandidateCertifiableEvent extends TimelineEvent {
  /**
   * @param {Object} props
   * @param {Date} props.when
   */
  constructor({ when }) {
    super({ code: CandidateCertifiableEvent.name, when });
  }
}
