import PixButton from '@1024pix/pix-ui/components/pix-button';
import { on } from '@ember/modifier';
import { action } from '@ember/object';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { t } from 'ember-intl';

import FormTextfield from '../form-textfield';

export default class PasswordResetDemandForm extends Component {
  @action
  async savePasswordResetDemand(event) {
    event && event.preventDefault();
    this.hasFailed = false;
    this.hasSucceeded = false;
    this.isButtonDisabled = true;

    if (!this.email) {
      return;
    }

    try {
      const passwordResetDemand = await this.store.createRecord('password-reset-demand', { email: this.email.trim() });
      await passwordResetDemand.save();
      this.hasSucceeded = true;
    } catch (error) {
      this.hasFailed = true;
      this.isButtonDisabled = false;
    }
  }

  <template>
    <form {{on "submit" this.savePasswordResetDemand}} class="authentication-password-reset-demand-form">
      <div class="password-reset-demand-form__input">
        <FormTextfield
          @label="{{t 'pages.password-reset-demand.fields.email.label'}}"
          @textfieldName="email"
          @validationStatus="default"
          @inputBindingValue={{this.email}}
          @require={{true}}
          @aria-describedby="password-reset-demand-error-message password-reset-demand-failed-message"
        />
      </div>
      <div>
        <PixButton @type="submit" @isDisabled={{this.isButtonDisabled}}>
          {{t "components.authentication.password-reset-demand.actions.receive-reset-link"}}
        </PixButton>
      </div>
      <div>
        {{t "components.authentication.password-reset-demand.actions.receive-reset-link"}}
        <a href="{{t 'components.authentication.password-reset-demand.contact-us-link.link-url'}}">
          {{t "components.authentication.password-reset-demand.contact-us-link.link-text"}}
        </a>
      </div>
    </form>
  </template>
}
