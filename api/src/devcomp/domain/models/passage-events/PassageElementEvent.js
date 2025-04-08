import { DomainError } from '../../../../shared/domain/errors.js';
import { assertHasUuidLength, assertNotNullOrUndefined } from '../../../../shared/domain/models/asserts.js';
import { PassageElementEventInstantiationError } from '../../errors.js';
import { PassageEvent } from './PassageEvent.js';

/**
 * @abstract PassageElementEvent
 * After the write operation is successful, the system generates events that describe what changed (like "Passage started" or "Video started").
 * These events serve as notifications about the updates.
 * See Event sourcing pattern for more information.
 * https://martinfowler.com/eaaDev/EventSourcing.html
 *
 * This is the base class for all PassageElementEvent. Subclasses should be named in past tense.
 */
class PassageElementEvent extends PassageEvent {
  constructor({ id, type, occurredAt, createdAt, passageId, elementId } = {}) {
    super({ id, type, occurredAt, createdAt, passageId, data: { elementId } });

    if (this.constructor === PassageElementEvent) {
      throw new PassageElementEventInstantiationError();
    }

    assertNotNullOrUndefined(elementId, 'The elementId property is required for a PassageElementEvent');
    assertHasUuidLength(elementId, 'The elementId property should be exactly 36 characters long');
  }
}

export { PassageElementEvent };
