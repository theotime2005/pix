// @ts-check
import { TimelineEvent } from './TimelineEvent.js';

export class CandidateCreatedEvent extends TimelineEvent {
  /**
   * @param {Object} props
   * @param {Date} props.when
   */
  constructor({ when }) {
    super({ code: CandidateCreatedEvent.name, when });
  }
}
