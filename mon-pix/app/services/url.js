import Service, { service } from '@ember/service';
import ENV from 'mon-pix/config/environment';

const ENGLISH_INTERNATIONAL_LOCALE = 'en';
const DUTCH_INTERNATIONAL_LOCALE = 'nl';
const SPANISH_INTERNATIONAL_LOCALE = 'es';

export default class Url extends Service {
  @service currentDomain;
  @service intl;
  @service locale;

  definedHomeUrl = ENV.rootURL;

  get showcase() {
    return { url: this._showcaseWebsiteUrl, linkText: this._showcaseWebsiteLinkText };
  }

  get homeUrl() {
    const currentLanguage = this.locale.currentLocale;
    return `${this.definedHomeUrl}?lang=${currentLanguage}`;
  }

  get cguUrl() {
    const currentLanguage = this.locale.currentLocale;

    if (this.currentDomain.isFranceDomain) {
      return `https://pix.fr/conditions-generales-d-utilisation`;
    }

    switch (currentLanguage) {
      case ENGLISH_INTERNATIONAL_LOCALE:
        return 'https://pix.org/en/terms-and-conditions';
      case DUTCH_INTERNATIONAL_LOCALE:
        return 'https://pix.org/nl-be/algemene-gebruiksvoorwaarden';
      case SPANISH_INTERNATIONAL_LOCALE:
        return 'https://pix.org/en-gb/terms-and-conditions ';
      default:
        return 'https://pix.org/fr/conditions-generales-d-utilisation';
    }
  }

  get legalNoticeUrl() {
    const currentLanguage = this.locale.currentLocale;

    if (this.currentDomain.isFranceDomain) {
      return `https://pix.fr/mentions-legales`;
    }

    switch (currentLanguage) {
      case ENGLISH_INTERNATIONAL_LOCALE:
        return 'https://pix.org/en/legal-notice';
      case DUTCH_INTERNATIONAL_LOCALE:
        return 'https://pix.org/nl-be/wettelijke-vermeldingen';
      case SPANISH_INTERNATIONAL_LOCALE:
        return 'https://pix.org/en/legal-notice';
      default:
        return 'https://pix.org/fr/mentions-legales';
    }
  }

  get dataProtectionPolicyUrl() {
    const currentLanguage = this.locale.currentLocale;

    if (this.currentDomain.isFranceDomain) {
      return `https://pix.fr/politique-protection-donnees-personnelles-app`;
    }

    switch (currentLanguage) {
      case ENGLISH_INTERNATIONAL_LOCALE:
        return 'https://pix.org/en/personal-data-protection-policy';
      case DUTCH_INTERNATIONAL_LOCALE:
        return 'https://pix.org/nl-be/beleid-inzake-de-bescherming-van-persoonsgegevens';
      case SPANISH_INTERNATIONAL_LOCALE:
        return 'https://pix.org/en-gb/personal-data-protection-policy';
      default:
        return 'https://pix.org/fr/politique-protection-donnees-personnelles-app';
    }
  }

  get accessibilityUrl() {
    const currentLanguage = this.locale.currentLocale;

    if (this.currentDomain.isFranceDomain) {
      return `https://pix.fr/accessibilite`;
    }

    switch (currentLanguage) {
      case ENGLISH_INTERNATIONAL_LOCALE:
        return 'https://pix.org/en/accessibility';
      case DUTCH_INTERNATIONAL_LOCALE:
        return 'https://pix.org/nl-be/toegankelijkheid';
      case SPANISH_INTERNATIONAL_LOCALE:
        return 'https://pix.org/en-gb/accessibility';
      default:
        return 'https://pix.org/fr/accessibilite';
    }
  }

  get accessibilityHelpUrl() {
    const currentLanguage = this.locale.currentLocale;
    if (currentLanguage === ENGLISH_INTERNATIONAL_LOCALE) {
      return `https://pix.${this.currentDomain.getExtension()}/en/help-accessibility`;
    }
    if (currentLanguage === SPANISH_INTERNATIONAL_LOCALE) {
      return `https://pix.${this.currentDomain.getExtension()}/en-gb/help-accessibility`;
    }
    return `https://pix.${this.currentDomain.getExtension()}/aide-accessibilite`;
  }

  get supportHomeUrl() {
    const currentLocale = this.locale.currentLocale;

    if (this.currentDomain.isFranceDomain) {
      return 'https://pix.fr/support';
    }

    let locale;
    if (currentLocale == 'nl') {
      locale = 'nl-BE';
    } else if (this.locale.isSupportedLocale(currentLocale)) {
      locale = currentLocale;
    } else {
      locale = ENGLISH_INTERNATIONAL_LOCALE;
    }

    return `https://pix.org/${locale}/support`;
  }

  get serverStatusUrl() {
    const currentLanguage = this.locale.currentLocale;
    return `https://status.pix.org/?locale=${currentLanguage}`;
  }

  get certificationResultsExplanationUrl() {
    if (this.currentDomain.isFranceDomain) {
      return 'https://pix.fr/certification-comprendre-score-niveau';
    }

    return 'https://pix.org/fr/certification-comprendre-score-niveau';
  }

  get _showcaseWebsiteUrl() {
    const currentLanguage = this.locale.currentLocale;

    if (currentLanguage === ENGLISH_INTERNATIONAL_LOCALE) {
      return `https://pix.${this.currentDomain.getExtension()}/en`;
    }
    if (currentLanguage === DUTCH_INTERNATIONAL_LOCALE) {
      return `https://pix.${this.currentDomain.getExtension()}/nl-be`;
    }
    return `https://pix.${this.currentDomain.getExtension()}`;
  }

  get _showcaseWebsiteLinkText() {
    return this.intl.t('navigation.showcase-homepage', { tld: this.currentDomain.getExtension() });
  }
}
