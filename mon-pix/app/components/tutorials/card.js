import { action } from '@ember/object';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import buttonStatusTypes from 'mon-pix/utils/button-status-types';

export default class Card extends Component {
  @service intl;
  @service store;
  @service currentUser;
  @service metrics;
  @service router;

  @tracked savingStatus;
  @tracked evaluationStatus;

  static TUTORIAL_PIX_URL_HOST = 'tutorial.pix.fr';

  constructor(owner, args) {
    super(owner, args);
    this.savingStatus = args.tutorial.isSaved ? buttonStatusTypes.recorded : buttonStatusTypes.unrecorded;
    this.evaluationStatus = args.tutorial.isEvaluated ? buttonStatusTypes.recorded : buttonStatusTypes.unrecorded;
  }

  get shouldShowActions() {
    return !!this.currentUser.user;
  }

  get saveInformation() {
    return this.savingStatus === buttonStatusTypes.recorded
      ? this.intl.t('pages.user-tutorials.list.tutorial.actions.remove.label')
      : this.intl.t('pages.user-tutorials.list.tutorial.actions.save.label');
  }

  get evaluateInformation() {
    return this.evaluationStatus === buttonStatusTypes.recorded
      ? this.intl.t('pages.user-tutorials.list.tutorial.actions.evaluate.label')
      : this.intl.t('pages.user-tutorials.list.tutorial.actions.evaluate.extra-information');
  }

  get isSaved() {
    return this.savingStatus === buttonStatusTypes.recorded;
  }

  get isTutorialEvaluated() {
    return this.evaluationStatus !== buttonStatusTypes.unrecorded;
  }

  get isTutorialSaved() {
    return this.savingStatus !== buttonStatusTypes.unrecorded;
  }

  get linkRel() {
    const tutorialUrl = new URL(this.args.tutorial.link);
    const isKnownHost = tutorialUrl.host === Card.TUTORIAL_PIX_URL_HOST;
    return isKnownHost ? null : 'noreferrer';
  }

  @action
  async toggleSaveTutorial() {
    if (this.isSaved) {
      await this._removeTutorial();
    } else {
      await this._saveTutorial();
    }
  }

  async _saveTutorial() {
    try {
      const userSavedTutorial = this.store.createRecord('userSavedTutorial', { tutorial: this.args.tutorial });
      await userSavedTutorial.save();
      this.savingStatus = buttonStatusTypes.recorded;
    } catch (e) {
      this.savingStatus = buttonStatusTypes.unrecorded;
    }
  }

  async _removeTutorial() {
    try {
      await this.args.tutorial.userSavedTutorial.destroyRecord();
      this.savingStatus = buttonStatusTypes.unrecorded;
    } catch (e) {
      this.savingStatus = buttonStatusTypes.recorded;
    }
    await this.args.afterRemove?.();
  }

  @action
  async evaluateTutorial() {
    const tutorial = this.args.tutorial;
    const tutorialEvaluation =
      tutorial.tutorialEvaluation ?? this.store.createRecord('tutorialEvaluation', { tutorial: tutorial });
    try {
      await tutorialEvaluation.save({
        adapterOptions: { tutorialId: tutorial.id, status: tutorialEvaluation.nextStatus },
      });
    } catch (e) {
      throw new Error("Un problème est survenu lors de la mise à jour de l'évaluation du tutoriel");
    } finally {
      this.evaluationStatus = tutorialEvaluation.isLiked ? buttonStatusTypes.recorded : buttonStatusTypes.unrecorded;
    }
  }

  @action
  trackAccess() {
    this.metrics.add({
      event: 'custom-event',
      'pix-event-category': 'Accès tuto',
      'pix-event-action': `Click depuis : ${this.router.currentRouteName}`,
      'pix-event-name': `Ouvre le tutoriel : ${this.args.tutorial.title}`,
    });
  }
}
