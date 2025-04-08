import { assertHasUuidLength, assertNotNullOrUndefined } from '../../../../shared/domain/models/asserts.js';
import { PassageElementEvent } from './PassageElementEvent.js';

/**
 * @class FlashcardsStartedEvent
 *
 * A FlashcardsStartedEvent is generated when a set of Modulix flashcards is started and saved in DB.
 */
class FlashcardsStartedEvent extends PassageElementEvent {
  constructor(props) {
    super({ type: 'FLASHCARDS_STARTED', ...props });

    this.elementId = props.data?.elementId;
  }
}

/**
 * @class FlashcardsVersoSeenEvent
 *
 * A FlashcardsVersoSeenEvent is generated when a card's answer is seen and saved in DB.
 */
class FlashcardsVersoSeenEvent extends PassageElementEvent {
  constructor(props) {
    super({ type: 'FLASHCARDS_VERSO_SEEN', ...props });

    assertNotNullOrUndefined(props.data?.cardId, 'The cardId is required for a FlashcardsVersoSeenEvent');
    assertHasUuidLength(props.data?.cardId, 'The cardId property should be exactly 36 characters long');

    this.elementId = props.data?.elementId;
    this.cardId = props.data?.cardId;
  }
}

/**
 * @class FlashcardsCardAutoAssessedEvent
 *
 * A FlashcardsCardAutoAssessedEvent is generated when an auto-assessment is given and saved in DB.
 */
class FlashcardsCardAutoAssessedEvent extends PassageElementEvent {
  constructor(props) {
    super({
      type: 'FLASHCARDS_CARD_AUTO_ASSESSED',
      ...props,
    });

    assertNotNullOrUndefined(props.data?.cardId, 'The cardId is required for a FlashcardsCardAutoAssessedEvent');
    assertHasUuidLength(props.data?.cardId, 'The cardId property should be exactly 36 characters long');
    assertNotNullOrUndefined(
      props.data?.autoAssessment,
      'The autoAssessment is required for a FlashcardsCardAutoAssessedEvent',
    );

    this.elementId = props.data?.elementId;
    this.cardId = props.data?.cardId;
    this.autoAssessment = props.data?.autoAssessment;
  }
}

/**
 * @class FlashcardsRectoReviewedEvent
 *
 * A FlashcardsRectoReviewedEvent is generated when a card's question is reviewed and saved in DB.
 */
class FlashcardsRectoReviewedEvent extends PassageElementEvent {
  constructor(props) {
    super({ type: 'FLASHCARDS_RECTO_REVIEWED', ...props });

    assertNotNullOrUndefined(props.data?.cardId, 'The cardId is required for a FlashcardsRectoReviewedEvent');
    assertHasUuidLength(props.data?.cardId, 'The cardId property should be exactly 36 characters long');

    this.elementId = props.data?.elementId;
    this.cardId = props.data?.cardId;
  }
}

/**
 * @class FlashcardsRetriedEvent
 *
 * A FlashcardsRetriedEvent is generated when a set of Modulix flashcards is retried and saved in DB.
 */
class FlashcardsRetriedEvent extends PassageElementEvent {
  constructor(props) {
    super({ type: 'FLASHCARDS_RETRIED', ...props });

    this.elementId = props.data?.elementId;
  }
}

export {
  FlashcardsCardAutoAssessedEvent,
  FlashcardsRectoReviewedEvent,
  FlashcardsRetriedEvent,
  FlashcardsStartedEvent,
  FlashcardsVersoSeenEvent,
};
