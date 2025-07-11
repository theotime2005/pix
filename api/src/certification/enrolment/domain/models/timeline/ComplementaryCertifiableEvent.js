// @ts-check
import { TimelineEvent } from './TimelineEvent.js';

export class ComplementaryCertifiableEvent extends TimelineEvent {
  /**
   * @param {Object} props
   * @param {Date} props.when
   * @param {string} props.complementaryCertificationKey
   */
  constructor({ when, complementaryCertificationKey }) {
    super({ code: ComplementaryCertifiableEvent.name, when, metadata: { complementaryCertificationKey } });
  }
}
