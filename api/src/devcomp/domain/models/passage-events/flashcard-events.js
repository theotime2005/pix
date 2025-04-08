import { assertHasUuidLength, assertNotNullOrUndefined } from '../../../../shared/domain/models/asserts.js';
import { PassageElementEvent } from './PassageElementEvent.js';

/**
 * @class FlashcardsStartedEvent
 *
 * A FlashcardsStartedEvent is generated when a set of Modulix flashcards is started and saved in DB.
 */
class FlashcardsStartedEvent extends PassageElementEvent {
  constructor({ id, occurredAt, createdAt, passageId, elementId }) {
    super({ id, type: 'FLASHCARDS_STARTED', occurredAt, createdAt, passageId, elementId });

    this.elementId = elementId;
  }
}

/**
 * @class FlashcardsVersoSeenEvent
 *
 * A FlashcardsVersoSeenEvent is generated when a card's answer is seen and saved in DB.
 */
class FlashcardsVersoSeenEvent extends PassageElementEvent {
  constructor({ id, occurredAt, createdAt, passageId, elementId, cardId }) {
    super({ id, type: 'FLASHCARDS_VERSO_SEEN', occurredAt, createdAt, passageId, elementId, data: { cardId } });

    assertNotNullOrUndefined(cardId, 'The cardId is required for a FlashcardsVersoSeenEvent');
    assertHasUuidLength(cardId, 'The cardId property should be exactly 36 characters long');

    this.elementId = elementId;
    this.cardId = cardId;
  }
}

/**
 * @class FlashcardsCardAutoAssessedEvent
 *
 * A FlashcardsCardAutoAssessedEvent is generated when an auto-assessment is given and saved in DB.
 */
class FlashcardsCardAutoAssessedEvent extends PassageElementEvent {
  constructor({ id, occurredAt, createdAt, passageId, elementId, cardId, autoAssessment }) {
    super({
      id,
      type: 'FLASHCARDS_CARD_AUTO_ASSESSED',
      occurredAt,
      createdAt,
      passageId,
      elementId,
      data: { cardId, autoAssessment },
    });

    assertNotNullOrUndefined(cardId, 'The cardId is required for a FlashcardsCardAutoAssessedEvent');
    assertHasUuidLength(cardId, 'The cardId property should be exactly 36 characters long');
    assertNotNullOrUndefined(autoAssessment, 'The autoAssessment is required for a FlashcardsCardAutoAssessedEvent');

    this.elementId = elementId;
    this.cardId = cardId;
    this.autoAssessment = autoAssessment;
  }
}

/**
 * @class FlashcardsRectoReviewedEvent
 *
 * A FlashcardsRectoReviewedEvent is generated when a card's question is reviewed and saved in DB.
 */
class FlashcardsRectoReviewedEvent extends PassageElementEvent {
  constructor({ id, occurredAt, createdAt, passageId, elementId, cardId }) {
    super({
      id,
      type: 'FLASHCARDS_RECTO_REVIEWED',
      occurredAt,
      createdAt,
      passageId,
      elementId,
      data: { cardId },
    });

    assertNotNullOrUndefined(cardId, 'The cardId is required for a FlashcardsRectoReviewedEvent');
    assertHasUuidLength(cardId, 'The cardId property should be exactly 36 characters long');

    this.elementId = elementId;
    this.cardId = cardId;
  }
}

/**
 * @class FlashcardsRetriedEvent
 *
 * A FlashcardsRetriedEvent is generated when a set of Modulix flashcards is retried and saved in DB.
 */
class FlashcardsRetriedEvent extends PassageElementEvent {
  constructor({ id, occurredAt, createdAt, passageId, elementId }) {
    super({ id, type: 'FLASHCARDS_RETRIED', occurredAt, createdAt, passageId, elementId });

    this.elementId = elementId;
  }
}

export {
  FlashcardsCardAutoAssessedEvent,
  FlashcardsRectoReviewedEvent,
  FlashcardsRetriedEvent,
  FlashcardsStartedEvent,
  FlashcardsVersoSeenEvent,
};
