import { setupTest } from 'ember-qunit';
import ENV from 'mon-pix/config/environment';
import { module, test } from 'qunit';
import sinon from 'sinon';

const { DEFAULT_LOCALE } = ENV.APP;

module('Unit | Services | locale', function (hooks) {
  setupTest(hooks);

  let localeService;
  let cookiesService;
  let currentDomainService;
  let dayjsService;
  let intlService;
  let metricsService;

  hooks.beforeEach(function () {
    localeService = this.owner.lookup('service:locale');

    cookiesService = this.owner.lookup('service:cookies');
    sinon.stub(cookiesService, 'write');
    sinon.stub(cookiesService, 'exists');

    currentDomainService = this.owner.lookup('service:currentDomain');
    sinon.stub(currentDomainService, 'getExtension');

    dayjsService = this.owner.lookup('service:dayjs');
    sinon.stub(dayjsService, 'setLocale');

    intlService = this.owner.lookup('service:intl');
    sinon.stub(intlService, 'primaryLocale');
    sinon.stub(intlService, 'setLocale');

    metricsService = this.owner.lookup('service:metrics');
    sinon.stub(metricsService, 'context').value({});
  });

  module('acceptLanguageHeader', function () {
    module('when the domain is pix.fr', function () {
      test('always returns fr-FR', function (assert) {
        // given
        currentDomainService.getExtension.returns('fr');
        sinon.stub(intlService, 'primaryLocale').value('en');

        // when
        const acceptLanguageHeader = localeService.acceptLanguageHeader;

        // then
        assert.strictEqual(acceptLanguageHeader, 'fr-FR');
      });
    });

    module('when the domain is pix.org', function () {
      test('always returns the current locale', function (assert) {
        // given
        currentDomainService.getExtension.returns('org');
        sinon.stub(intlService, 'primaryLocale').value('nl-BE');

        // when
        const acceptLanguageHeader = localeService.acceptLanguageHeader;

        // then
        assert.strictEqual(acceptLanguageHeader, 'nl-BE');
      });
    });
  });

  module('isSupportedLocale', function () {
    module('when locale is supported', function () {
      test('returns true', function (assert) {
        // given
        const locale = 'nl-BE';

        // when
        const result = localeService.isSupportedLocale(locale);

        // then
        assert.true(result);
      });
    });

    module('when locale is supported but not given in canonical form', function () {
      test('returns true', function (assert) {
        // given
        const locale = 'nl-be';

        // when
        const result = localeService.isSupportedLocale(locale);

        // then
        assert.true(result);
      });
    });

    module('when locale is valid but not supported', function () {
      test('returns false', function (assert) {
        // given
        const locale = 'ko';

        // when
        const result = localeService.isSupportedLocale(locale);

        // then
        assert.false(result);
      });
    });

    module('when locale is invalid', function () {
      test('returns false', function (assert) {
        // given
        const locale = 'invalid_locale_in_bad_format';

        // when
        const result = localeService.isSupportedLocale(locale);

        // then
        assert.false(result);
      });
    });
  });

  module('setLocale', function () {
    test('set app locale', function (assert) {
      // given
      const locale = DEFAULT_LOCALE;

      // when
      localeService.setLocale(locale);

      // then
      sinon.assert.calledWith(intlService.setLocale, locale);
      sinon.assert.calledWith(dayjsService.setLocale, locale);
      assert.strictEqual(metricsService.context.locale, locale);
    });
  });

  module('setUserLocale', function () {
    module('when the current domain is "fr"', function () {
      module('when there is no cookie locale', function () {
        test('sets the locale with "fr" and adds a cookie locale with "fr-FR"', function (assert) {
          // given
          cookiesService.exists.returns(false);
          currentDomainService.getExtension.returns('fr');

          // when
          localeService.setUserLocale();

          // then
          sinon.assert.calledWith(cookiesService.write, 'locale', 'fr-FR');
          sinon.assert.calledWith(intlService.setLocale, 'fr');
          sinon.assert.calledWith(dayjsService.setLocale, 'fr');
          assert.strictEqual(metricsService.context.locale, 'fr');
        });
      });

      module('when there is already a cookie locale', function () {
        test('sets the locale with "fr" and does not update cookie locale', function (assert) {
          // given
          cookiesService.exists.returns(true);
          currentDomainService.getExtension.returns('fr');

          // when
          localeService.setUserLocale();

          // then
          sinon.assert.notCalled(cookiesService.write);
          sinon.assert.calledWith(intlService.setLocale, 'fr');
          sinon.assert.calledWith(dayjsService.setLocale, 'fr');
          assert.strictEqual(metricsService.context.locale, 'fr');
        });
      });
    });

    module('when the current domain extension is "org"', function () {
      module('when no current user', function () {
        module('when there is no overriding language', function () {
          test('sets the the default locale', async function (assert) {
            // given
            currentDomainService.getExtension.returns('org');

            // when
            localeService.setUserLocale();

            // then
            sinon.assert.calledWith(intlService.setLocale, DEFAULT_LOCALE);
            sinon.assert.calledWith(dayjsService.setLocale, DEFAULT_LOCALE);
            assert.strictEqual(metricsService.context.locale, DEFAULT_LOCALE);
          });
        });

        module('when the overriding language is supported', function () {
          test('sets the locale with the overriding language', function (assert) {
            // given
            currentDomainService.getExtension.returns('org');
            const overridingLanguage = 'es';

            // when
            localeService.setUserLocale(null, overridingLanguage);

            // then
            sinon.assert.calledWith(intlService.setLocale, 'es');
            sinon.assert.calledWith(dayjsService.setLocale, 'es');
            assert.strictEqual(metricsService.context.locale, 'es');
          });
        });

        module('when the overriding language is not supported', function () {
          test('sets the default locale', function (assert) {
            // given
            currentDomainService.getExtension.returns('org');
            const badOverridingLanguage = 'xxx';

            // when
            localeService.setUserLocale(null, badOverridingLanguage);

            // then
            sinon.assert.calledWith(intlService.setLocale, DEFAULT_LOCALE);
            sinon.assert.calledWith(dayjsService.setLocale, DEFAULT_LOCALE);
            assert.strictEqual(metricsService.context.locale, DEFAULT_LOCALE);
          });
        });
      });

      module('when user is loaded', function () {
        module('when there is no overriding language', function () {
          test('sets the locale with the user language', async function (assert) {
            // given
            currentDomainService.getExtension.returns('org');
            const user = { lang: 'nl' };

            // when
            localeService.setUserLocale(user);

            // then
            sinon.assert.calledWith(intlService.setLocale, 'nl');
            sinon.assert.calledWith(dayjsService.setLocale, 'nl');
            assert.strictEqual(metricsService.context.locale, 'nl');
          });
        });

        module('when the overriding language is given', function () {
          test('sets the locale with the overriding language', function (assert) {
            // given
            currentDomainService.getExtension.returns('org');
            const user = { lang: 'nl' };
            const overridingLanguage = 'es';

            // when
            localeService.setUserLocale(user, overridingLanguage);

            // then
            sinon.assert.calledWith(intlService.setLocale, 'es');
            sinon.assert.calledWith(dayjsService.setLocale, 'es');
            assert.strictEqual(metricsService.context.locale, 'es');
          });
        });
      });
    });
  });

  module('availableLanguagesForSwitcher', function () {
    test('returns available languages for switcher with french first', function (assert) {
      // when
      const availableLanguagesForSwitcher = localeService.availableLanguagesForSwitcher;

      // then
      assert.deepEqual(availableLanguagesForSwitcher, [
        { label: 'Français', value: 'fr' },
        { label: 'English', value: 'en' },
        { label: 'Nederlands', value: 'nl' },
      ]);
    });
  });
});
