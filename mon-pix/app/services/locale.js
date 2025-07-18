import Service, { service } from '@ember/service';
import ENV from 'mon-pix/config/environment';
import languages from 'mon-pix/languages';

const { DEFAULT_LOCALE, COOKIE_LOCALE_LIFESPAN_IN_SECONDS } = ENV.APP;
export const FRENCH_INTERNATIONAL_LOCALE = 'fr';
export const ENGLISH_INTERNATIONAL_LOCALE = 'en';
export const FRENCH_FRANCE_LOCALE = 'fr-FR';

const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'fr-BE', 'fr-FR', 'nl-BE', 'nl'];

const supportedLanguages = Object.keys(languages);

export default class LocaleService extends Service {
  @service cookies;
  @service currentDomain;
  @service intl;
  @service dayjs;
  @service metrics;

  isSupportedLocale(locale) {
    try {
      const localeCanonicalName = Intl.getCanonicalLocales(locale)?.[0];
      return SUPPORTED_LOCALES.some((supportedLocale) => localeCanonicalName == supportedLocale);
    } catch {
      return false;
    }
  }

  setLocale(locale) {
    this.metrics.context.locale = locale;
    this.intl.setLocale(locale);
    this.dayjs.setLocale(locale);
  }

  setUserLocale(currentUser = null, overridingLanguage = null) {
    if (this.currentDomain.isFranceDomain) {
      this.setLocale(FRENCH_INTERNATIONAL_LOCALE);
      this.#setLocaleCookie(FRENCH_FRANCE_LOCALE);
      return;
    }

    const supportedLanguage = this.#findSupportedLanguage(overridingLanguage);
    if (supportedLanguage) {
      this.setLocale(supportedLanguage);
      return;
    }

    if (currentUser) {
      this.setLocale(currentUser.lang);
      return;
    }

    this.setLocale(DEFAULT_LOCALE);
  }

  #findSupportedLanguage(language) {
    if (!language) return;
    return supportedLanguages.includes(language) ? language : DEFAULT_LOCALE;
  }

  #setLocaleCookie(locale) {
    const cookie = this.cookies.exists('locale');
    if (cookie) return;

    this.cookies.write('locale', locale, {
      domain: `pix.${this.currentDomain.getExtension()}`,
      maxAge: COOKIE_LOCALE_LIFESPAN_IN_SECONDS,
      path: '/',
      sameSite: 'Strict',
    });
  }
}
