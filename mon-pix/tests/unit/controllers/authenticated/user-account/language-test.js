import { setupTest } from 'ember-qunit';
import { module, test } from 'qunit';
import sinon from 'sinon';

module('Unit | Controller | user-account/language', function (hooks) {
  setupTest(hooks);

  let controller;
  let userSaveStub;
  let setCurrentLocaleStub;

  hooks.beforeEach(function () {
    userSaveStub = sinon.stub();
    setCurrentLocaleStub = sinon.stub();

    controller = this.owner.lookup('controller:authenticated/user-account/language');
    controller.currentUser = { user: { save: userSaveStub } };
    controller.locale = { setCurrentLocale: setCurrentLocaleStub };
    controller.set('shouldDisplayLanguageUpdatedMessage', false);
  });

  module('#onLanguageChange', function () {
    module('when domain is international', function () {
      test('saves user language and update application locale', async function (assert) {
        // given
        const language = 'en';

        controller.currentDomain = { isFranceDomain: false };

        // when
        await controller.onLanguageChange(language);

        // then
        sinon.assert.calledWith(userSaveStub, { adapterOptions: { lang: language } });
        sinon.assert.calledWith(setCurrentLocaleStub, language);
        assert.true(controller.shouldDisplayLanguageUpdatedMessage);
        assert.ok(true);
      });
    });
    module('when in France domain', function () {
      test('does not save user language and update application locale', async function (assert) {
        // given
        const language = 'en';

        controller.currentDomain = { isFranceDomain: true };

        // when
        await controller.onLanguageChange(language);

        // then
        sinon.assert.notCalled(userSaveStub);
        sinon.assert.notCalled(setCurrentLocaleStub);
        assert.ok(true);
      });
    });
  });
});
