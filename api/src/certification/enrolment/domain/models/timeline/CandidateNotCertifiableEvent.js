// @ts-check
import { TimelineEvent } from './TimelineEvent.js';

export class CertificationNotCertifiableEvent extends TimelineEvent {
  /**
   * @param {Object} props
   * @param {Date} props.when
   */
  constructor({ when }) {
    super({ code: CertificationNotCertifiableEvent.name, when });
  }
}
