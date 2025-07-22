import Service, { service } from '@ember/service';
import ENV from 'mon-pix/config/environment';

const { DEFAULT_LOCALE, SUPPORTED_LOCALES, COOKIE_LOCALE_LIFESPAN_IN_SECONDS } = ENV.APP;

export const FRENCH_FRANCE_LOCALE = 'fr-FR';
export const FRENCH_INTERNATIONAL_LOCALE = 'fr';
export const ENGLISH_INTERNATIONAL_LOCALE = 'en';

const VISIBLE_LANGUAGES = {
  en: { value: 'English', languageSwitcherDisplayed: true },
  es: { value: 'Español', languageSwitcherDisplayed: false },
  fr: { value: 'Français', languageSwitcherDisplayed: true },
  nl: { value: 'Nederlands', languageSwitcherDisplayed: true },
};

export default class LocaleService extends Service {
  @service cookies;
  @service currentDomain;
  @service intl;
  @service dayjs;
  @service metrics;

  get supportedLocales() {
    return SUPPORTED_LOCALES;
  }

  get currentLocale() {
    return this.intl.primaryLocale;
  }

  get acceptLanguageHeader() {
    if (this.currentDomain.isFranceDomain) return FRENCH_FRANCE_LOCALE;
    return this.currentLocale;
  }

  get availableLanguagesForSwitcher() {
    const FRENCH_LANGUAGE = 'fr';
    const options = Object.entries(VISIBLE_LANGUAGES)
      .filter(([_, config]) => config.languageSwitcherDisplayed)
      .map(([key, config]) => ({ label: config.value, value: key }));

    return options.sort((option) => (option.value === FRENCH_LANGUAGE ? -1 : 1));
  }

  isSupportedLocale(locale) {
    try {
      const localeCanonicalName = Intl.getCanonicalLocales(locale)?.[0];
      return this.supportedLocales.some((supportedLocale) => localeCanonicalName == supportedLocale);
    } catch {
      return false;
    }
  }

  setCurrentLocale(locale) {
    this.metrics.context.locale = locale;
    this.intl.setLocale(locale);
    this.dayjs.setLocale(locale);
  }

  detectBestLocale({ language, user }) {
    if (this.currentDomain.isFranceDomain) {
      this.setCurrentLocale(FRENCH_INTERNATIONAL_LOCALE);
      this.#setLocaleCookie(FRENCH_FRANCE_LOCALE);
      return;
    }

    const supportedLanguage = this.#findSupportedLanguage(language);
    if (supportedLanguage) {
      this.setCurrentLocale(supportedLanguage);
      return;
    }

    if (user) {
      this.setCurrentLocale(user.lang);
      return;
    }

    this.setCurrentLocale(DEFAULT_LOCALE);
  }

  #findSupportedLanguage(language) {
    if (!language) return;
    const supportedLanguages = Object.keys(VISIBLE_LANGUAGES);
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
