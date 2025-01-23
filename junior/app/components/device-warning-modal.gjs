import trapFocus from '@1024pix/pix-ui/app/modifiers/trap-focus';
import PixButton from '@1024pix/pix-ui/components/pix-button';
import PixButtonLink from '@1024pix/pix-ui/components/pix-button-link';
import {action} from '@ember/object';
import {service} from '@ember/service';
import Component from '@glimmer/component';
import {tracked} from '@glimmer/tracking';
import {t} from 'ember-intl';

import {types} from '../services/device';
const { MOBILE, TABLET } = types;

export default class DeviceWarningModal extends Component {
  @tracked showModal = false;
  @tracked deviceType = '';
  @tracked orientation = '';
  @service device;
  @service intl;
  @service currentLearner;

  shouldDisplayModal() {
    const { type, orientation } = this.device.info;
    this.deviceType = type;
    this.orientation = orientation;

    if (this.deviceType === MOBILE) {
      return true;
    }

    const shouldDisplay = type === TABLET && orientation.isPortrait();

    if (!shouldDisplay && this.showModal) {
      this.currentLearner.setHasSeenWarningModal();
    } else if (this.currentLearner.hasSeenWarningModal) {
      return false;
    }

    return shouldDisplay;
  }

  constructor() {
    super(...arguments);
    if (this.shouldDisplayModal()) {
      this.showModal = true;
    }

    this.device.addOrientationChangeListener(() => {
      this.showModal = this.shouldDisplayModal();
    });
  }

  @action
  onCloseModal() {
    this.currentLearner.setHasSeenWarningModal();
    this.showModal = false;
  }

  get title() {
    return this.intl.t(`components.device-warning-modal.${this.deviceType}.title`);
  }

  get contentText() {
    return this.intl.t(`components.device-warning-modal.${this.deviceType}.subtitle`);
  }

  get isTablet() {
    return this.deviceType === TABLET;
  }

  get isMobile() {
    return this.deviceType === MOBILE;
  }

  get modalClassName() {
    if (this.deviceType === TABLET) {
      return 'device-warning-modal is-tablet';
    }

    if (this.deviceType === MOBILE && this.orientation.isLandscape()) {
      return 'device-warning-modal is-landscape';
    }

    return 'device-warning-modal';
  }
  <template>
    <div
      class="device-warning-modal-overlay {{unless this.showModal ' device-warning-modal-overlay--hidden'}}"
      {{trapFocus this.showModal}}
    >
      <div class={{this.modalClassName}} role="dialog">
        {{#if this.isTablet}}
          <PixButton
            class="close-button"
            @iconBefore="close"
            @triggerAction={{this.onCloseModal}}
            @ariaLabel="Fermer"
            @size="small"
            @variant="secondary"
          >
            {{t "common.actions.close"}}
          </PixButton>
        {{/if}}

        <section>
          <img src="/images/logo-in-one-line.svg" alt="Pix Junior" class="logo" />
          <h1>
            {{this.title}}
          </h1>
          <span>
            {{#if this.isTablet}}
              <img
                src="/images/icons/screen-rotation.svg"
                alt=""
                aria-describedby="device-warning-modal-text-content"
              />
            {{/if}}
            <h2 id="device-warning-modal-text-content">
              {{this.contentText}}
            </h2>
          </span>
          {{#if this.isMobile}}
            <PixButtonLink class="button-link" @href="https://pix.fr/enseignement-primaire">
              {{t "components.device-warning-modal.button.label"}}
            </PixButtonLink>
          {{/if}}
        </section>
      </div>
    </div>
  </template>
}
