import { visit } from '@1024pix/ember-testing-library';
import { currentURL } from '@ember/test-helpers';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { setupApplicationTest } from 'ember-qunit';
import { module, test } from 'qunit';

import { authenticateAdminMemberWithRole } from '../../../../helpers/test-init';

module('Acceptance | authenticated/sessions/session/candidates', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  module('When user is not logged in', function () {
    test('it should not be accessible by an unauthenticated user', async function (assert) {
      // when
      await visit('/sessions/1/candidates');

      // then
      assert.strictEqual(currentURL(), '/login');
    });
  });

  module('When user is logged in', function (hooks) {
    hooks.beforeEach(async function () {
      // given
      await authenticateAdminMemberWithRole({ isSuperAdmin: true })(server);
      server.create('session', { id: '1' });
    });

    test('visiting /sessions/1', async function (assert) {
      // when
      await visit('/sessions/1/candidates');

      // then
      assert.strictEqual(currentURL(), '/sessions/1/candidates');
    });
  });
});
