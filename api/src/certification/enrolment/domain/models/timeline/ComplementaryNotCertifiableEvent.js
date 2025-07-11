// @ts-check
import { TimelineEvent } from './TimelineEvent.js';

export class ComplementaryNotCertifiableEvent extends TimelineEvent {
  /**
   * @param {Object} props
   * @param {Date} props.when
   * @param {number} props.complementaryCertificationId
   */
  constructor({ when, complementaryCertificationId }) {
    super({ code: ComplementaryNotCertifiableEvent.name, when, metadata: { complementaryCertificationId } });
  }
}
