import { t } from 'ember-intl/test-support';
import { setupTest } from 'ember-qunit';
import { module, test } from 'qunit';

import setupIntl from '../../helpers/setup-intl';

module('Unit | Service | errorMessages', function (hooks) {
  setupTest(hooks);
  setupIntl(hooks);

  module('getErrorMessage', function () {
    module('when error is a simple error', function () {
      module('when no mapping is found', function () {
        test('returns a default message', async function (assert) {
          // given
          const errorMessages = this.owner.lookup('service:errorMessages');
          const unknowni18nKey = Symbol('unknown i18n key');

          // when
          const message = errorMessages.getErrorMessage(unknowni18nKey);

          // then
          assert.strictEqual(message, t('common.error'));
        });
      });

      test('matches first on error code then on error status', async function (assert) {
        // given
        const errorMessages = this.owner.lookup('service:errorMessages');
        const unknowni18nKey = Symbol('unknown i18n key');

        // when
        const message = errorMessages.getErrorMessage(unknowni18nKey);

        // then
        assert.strictEqual(message, t('common.error'));
      });
    });

    module('when error is a JSON:API error', function () {
      module('when no mapping is found', function () {
        test('returns a default message', async function (assert) {
          // given
          const errorMessages = this.owner.lookup('service:errorMessages');
          const unknowni18nKey = Symbol('unknown i18n key');

          // when
          const message = errorMessages.getErrorMessage(unknowni18nKey);

          // then
          assert.strictEqual(message, t('common.error'));
        });
      });

      test('matches first on error code then on error status', async function (assert) {
        // given
        const errorMessages = this.owner.lookup('service:errorMessages');
        const unknowni18nKey = Symbol('unknown i18n key');

        // when
        const message = errorMessages.getErrorMessage(unknowni18nKey);

        // then
        assert.strictEqual(message, t('common.error'));
      });
    });
  });
});
