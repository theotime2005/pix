import Service, { inject as service } from '@ember/service';
import get from 'lodash/get';

const ERROR_CODE_MAPPING = {
  EXPIRED_AUTHENTICATION_KEY: {
    i18nKey: 'pages.login-or-register-oidc.error.expired-authentication-key',
  },
  USER_IS_TEMPORARY_BLOCKED: {
    i18nKey: 'common.api-error-messages.login-user-temporary-blocked-error',
    formatOptionsFn: () => {
      return {
        url: '/mot-de-passe-oublie',
        htmlSafe: true,
      };
    },
  },
  USER_IS_BLOCKED: {
    i18nKey: 'common.api-error-messages.login-user-blocked-error',
    formatOptionsFn: () => {
      return {
        url: 'https://support.pix.org/support/tickets/new',
        htmlSafe: true,
      };
    },
  },
  INVALID_LOCALE_FORMAT: {
    i18nKey: 'pages.sign-up.errors.invalid-locale-format',
    formatOptionsFn: (error) => {
      return { invalidLocale: error.meta.locale };
    },
  },
  LOCALE_NOT_SUPPORTED: {
    i18nKey: 'pages.sign-up.errors.locale-not-supported',
    formatOptionsFn: (error) => {
      return { localeNotSupported: error.meta.locale };
    },
  },
};

const HTTP_STATUS_MAPPING = {
  401: {
    i18nKey: 'pages.login-or-register-oidc.error.login-unauthorized-error',
  },
  409: {
    i18nKey: 'pages.login-or-register-oidc.error.account-conflict',
  },
};

export default class ErrorMessagesService extends Service {
  @service intl;

  getErrorMessage(error) {
    error = get(error, 'errors[0]') || error;
    const mapping = ERROR_CODE_MAPPING[error.code] || HTTP_STATUS_MAPPING[error.status];

    let i18nKey;
    let formatOptionsFn;
    let formatOptions;
    let formattedGenericErrorDetails;
    if (mapping) {
      ({ i18nKey, formatOptionsFn } = mapping);
      formatOptions = formatOptionsFn && formatOptionsFn(error);
    } else {
      i18nKey = 'common.error';
      formattedGenericErrorDetails = error.detail && ` (${error.detail})`;
    }

    let message = this.intl.t(i18nKey, formatOptions);
    if (formattedGenericErrorDetails) {
      message += formattedGenericErrorDetails;
    }

    return message;
  }
}
