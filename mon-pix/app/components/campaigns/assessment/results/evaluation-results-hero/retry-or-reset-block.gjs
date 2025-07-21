import PixBannerAlert from '@1024pix/pix-ui/components/pix-banner-alert';
import PixButton from '@1024pix/pix-ui/components/pix-button';
import PixButtonLink from '@1024pix/pix-ui/components/pix-button-link';
import PixModal from '@1024pix/pix-ui/components/pix-modal';
import PixNotificationAlert from '@1024pix/pix-ui/components/pix-notification-alert';
import { action } from '@ember/object';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import dayjsDurationHumanize from 'ember-dayjs/helpers/dayjs-duration-humanize';
import { t } from 'ember-intl';

export default class EvaluationResultsHeroRetryOrResetBlock extends Component {
  @service metrics;
  @service intl;
  @service featureToggles;
  @service dayjs;
  @tracked isResetModalVisible = false;

  retryQueryParams = { retry: true };
  resetQueryParams = { reset: true };

  constructor() {
    super(...arguments);
    if (this.args.campaignParticipationResult.canRetry) {
      this.metrics.trackEvent({
        event: 'custom-event',
        'pix-event-category': 'Fin de parcours',
        'pix-event-action': 'Affichage du bloc RAZ/Repasser un parcours',
        'pix-event-name': "Présence du bouton 'Repasser un parcours'",
      });
    }

    if (this.args.campaignParticipationResult.canReset) {
      this.metrics.trackEvent({
        event: 'custom-event',
        'pix-event-category': 'Fin de parcours',
        'pix-event-action': 'Affichage du bloc RAZ/Repasser un parcours',
        'pix-event-name': "Présence du bouton 'Remettre à zéro et tout retenter'",
      });
    }
  }

  @action
  handleRetryClick() {
    this.metrics.trackEvent({
      event: 'custom-event',
      'pix-event-category': 'Fin de parcours',
      'pix-event-action': 'Affichage du bloc RAZ/Repasser un parcours',
      'pix-event-name': "Clic sur le bouton 'Repasser mon parcours'",
    });
  }

  @action
  toggleResetModalVisibility() {
    if (!this.isResetModalVisible) {
      this.metrics.trackEvent({
        event: 'custom-event',
        'pix-event-category': 'Fin de parcours',
        'pix-event-action': 'Affichage du bloc RAZ/Repasser un parcours',
        'pix-event-name': "Ouverture de la modale 'Remettre à zéro et tout retenter'",
      });
    }

    this.isResetModalVisible = !this.isResetModalVisible;
  }

  @action
  handleResetClick() {
    this.metrics.trackEvent({
      event: 'custom-event',
      'pix-event-category': 'Fin de parcours',
      'pix-event-action': 'Affichage du bloc RAZ/Repasser un parcours',
      'pix-event-name': "Confirmation de la modale 'Remettre à zéro et tout retenter'",
    });
  }

  get retryOrResetExplanation() {
    const { campaignParticipationResult } = this.args;
    const isAutoShareEnabled = this.featureToggles?.featureToggles?.isAutoShareEnabled || false;

    if (campaignParticipationResult.canReset && campaignParticipationResult.canRetry) {
      if (isAutoShareEnabled) {
        return this.intl.t('pages.skill-review.reset.notification-with-auto-share');
      }
      return this.intl.t('pages.skill-review.reset.notification');
    }

    if (isAutoShareEnabled) {
      return this.intl.t('pages.skill-review.retry.notification-with-auto-share');
    }
    return this.intl.t('pages.skill-review.retry.notification');
  }

  <template>
    <div class="evaluation-results-hero__retry">
      <div class="evaluation-results-hero-retry__content">
        <h2 class="evaluation-results-hero-retry__title">
          {{t "pages.skill-review.hero.retry.title"}}
        </h2>
        <p class="evaluation-results-hero-retry__description">
          {{t "pages.skill-review.hero.retry.description"}}
        </p>
        <div class="evaluation-results-hero-retry__actions">
          {{#if @campaignParticipationResult.canRetry}}
            {{#if @campaignParticipationResult.remainingSecondsBeforeRetrying}}
              <div>
                <p class="evaluation-results-hero-retry__soon-title">
                  {{t
                    "pages.skill-review.hero.retry.retryIn"
                    duration=(dayjsDurationHumanize
                      @campaignParticipationResult.remainingSecondsBeforeRetrying "second"
                    )
                  }}
                </p>
                <PixButton @variant="secondary" @isDisabled={{true}}>
                  {{t "pages.skill-review.hero.retry.actions.retry"}}
                </PixButton>
              </div>
            {{else}}
              <PixButtonLink
                @variant="secondary"
                @route="campaigns.entry-point"
                @model={{@campaign.code}}
                @query={{this.retryQueryParams}}
                onclick={{this.handleRetryClick}}
              >
                {{t "pages.skill-review.hero.retry.actions.retry"}}
              </PixButtonLink>
            {{/if}}
          {{/if}}

          {{#if @campaignParticipationResult.canReset}}
            <PixButton @variant="tertiary" @triggerAction={{this.toggleResetModalVisibility}}>
              {{t "pages.skill-review.hero.retry.actions.reset"}}
            </PixButton>
            <PixModal
              @title={{t "pages.skill-review.reset.button"}}
              @showModal={{this.isResetModalVisible}}
              @onCloseButtonClick={{this.toggleResetModalVisibility}}
            >
              <:content>
                <PixBannerAlert @type="warning">{{t "pages.skill-review.reset.modal.warning-text"}}</PixBannerAlert>
                <p class="reset-campaign-participation-modal__text">
                  {{t
                    "pages.skill-review.reset.modal.text"
                    targetProfileName=@campaign.targetProfileName
                    htmlSafe=true
                  }}
                </p>
              </:content>
              <:footer>
                <div class="reset-campaign-participation-modal__footer">
                  <PixButton @variant="secondary" @triggerAction={{this.toggleResetModalVisibility}}>
                    {{t "common.actions.cancel"}}
                  </PixButton>
                  <PixButtonLink
                    @route="campaigns.entry-point"
                    @model={{@campaign.code}}
                    @query={{this.resetQueryParams}}
                    @variant="error"
                    onclick={{this.handleResetClick}}
                  >
                    {{t "common.actions.confirm"}}
                  </PixButtonLink>
                </div>
              </:footer>
            </PixModal>
          {{/if}}
        </div>
        <PixNotificationAlert class="evaluation-results-hero-retry__message" @withIcon={{true}}>
          {{this.retryOrResetExplanation}}
        </PixNotificationAlert>
      </div>
    </div>
  </template>
}
