import { action } from '@ember/object';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import isEmailValid from '../../utils/email-validator';

const ERROR_INPUT_MESSAGE_MAP = {
  termsOfServiceNotSelected: 'pages.login-or-register-oidc.error.error-message',
  invalidEmail: 'pages.login-or-register-oidc.error.invalid-email',
};

export default class LoginOrRegisterOidcComponent extends Component {
  @service intl;
  @service session;
  @service currentDomain;
  @service oidcIdentityProviders;
  @service store;
  @service url;
  @service errorMessages;

  @tracked isTermsOfServiceValidated = false;
  @tracked loginErrorMessage = null;
  @tracked registerErrorMessage = null;
  @tracked email = '';
  @tracked password = '';
  @tracked emailValidationStatus = 'default';
  @tracked emailValidationMessage = null;
  @tracked isLoginLoading = false;
  @tracked isRegisterLoading = false;

  get identityProviderOrganizationName() {
    return this.oidcIdentityProviders[this.args.identityProviderSlug]?.organizationName;
  }

  get givenName() {
    return this.args.givenName;
  }

  get familyName() {
    return this.args.familyName;
  }

  get currentLanguage() {
    return this.intl.primaryLocale;
  }

  get cguUrl() {
    return this.url.cguUrl;
  }

  get dataProtectionPolicyUrl() {
    return this.url.dataProtectionPolicyUrl;
  }

  @action
  async login(event) {
    event.preventDefault();

    this.loginErrorMessage = null;

    if (!this.isFormValid) return;

    this.isLoginLoading = true;

    try {
      await this.args.onLogin({ enteredEmail: this.email, enteredPassword: this.password });
    } catch (responseError) {
      this.loginErrorMessage = this.errorMessages.getErrorMessage(responseError);
    } finally {
      this.isLoginLoading = false;
    }
  }

  @action
  async register() {
    if (!this.isTermsOfServiceValidated) {
      this.registerErrorMessage = this.intl.t(ERROR_INPUT_MESSAGE_MAP['termsOfServiceNotSelected']);
      return;
    }

    this.isRegisterLoading = true;
    this.registerErrorMessage = null;

    try {
      await this.session.authenticate('authenticator:oidc', {
        authenticationKey: this.args.authenticationKey,
        identityProviderSlug: this.args.identityProviderSlug,
        hostSlug: 'users',
      });
    } catch (responseError) {
      const error = get(responseError, 'errors[0]');
      this.registerErrorMessage = this.errorMessages.getErrorMessage(error);
    } finally {
      this.isRegisterLoading = false;
    }
  }

  @action
  validateEmail(event) {
    this.email = event.target.value;
    this.email = this.email.trim();
    const isInvalidInput = !isEmailValid(this.email);

    this.emailValidationMessage = null;
    this.emailValidationStatus = 'default';

    if (isInvalidInput) {
      this.emailValidationStatus = 'error';
      this.emailValidationMessage = this.intl.t(ERROR_INPUT_MESSAGE_MAP['invalidEmail']);
    }
  }

  @action
  setPassword(event) {
    this.password = event.target.value;
  }

  get isFormValid() {
    return isEmailValid(this.email) && !isEmpty(this.password);
  }

  @action
  onChange(event) {
    this.isTermsOfServiceValidated = !!event.target.checked;
  }
}
