import { visit } from '@1024pix/ember-testing-library';
import { currentURL } from '@ember/test-helpers';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { setupApplicationTest } from 'ember-qunit';
import { module, test } from 'qunit';

import { authenticateAdminMemberWithRole } from '../../helpers/test-init';

module('Acceptance | authenticated/candidates/1/timeline', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  module('When user is not logged in', function () {
    test('it should not be accessible by an unauthenticated user', async function (assert) {
      // when
      await visit('/candidates/1/timeline');

      // then
      assert.strictEqual(currentURL(), '/login');
    });
  });

  module('When user is logged in', function (hooks) {
    hooks.beforeEach(async function () {
      // given
      await authenticateAdminMemberWithRole({ isSuperAdmin: true })(server);
      server.create('certification-candidate-timeline', {
        id: '1',
        events: [{ code: 'CandidateCertifiableEvent', when: new Date() }],
      });
    });

    test('visiting /candidates/1/timeline', async function (assert) {
      // when
      await visit('/candidates/1/timeline');

      // then
      assert.strictEqual(currentURL(), '/candidates/1/timeline');
    });
  });
});
