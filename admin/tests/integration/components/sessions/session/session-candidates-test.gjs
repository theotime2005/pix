import { render } from '@1024pix/ember-testing-library';
import SessionCandidates from 'pix-admin/components/sessions/session/session-candidates';
import { SUBSCRIPTION_TYPES } from 'pix-admin/models/subscription';
import { module, test } from 'qunit';

import setupIntlRenderingTest from '../../../../helpers/setup-intl-rendering';

module('Integration | Component | Sessions | Session | SessionCandidates', function (hooks) {
  setupIntlRenderingTest(hooks);

  let store;

  hooks.beforeEach(async function () {
    store = this.owner.lookup('service:store');
  });

  test('it should display candidate information', async function (assert) {
    // given
    const complementaryCertificationId = 2;
    const coreSubscription = store.createRecord('subscription', {
      type: SUBSCRIPTION_TYPES.CORE,
      complementaryCertificationId: null,
    });
    const complementarySubscription = store.createRecord('subscription', {
      type: SUBSCRIPTION_TYPES.COMPLEMENTARY,
      complementaryCertificationId,
    });
    const candidate = _buildCertificationCandidate({
      subscriptions: [coreSubscription, complementarySubscription],
    });

    const certificationCandidates = [store.createRecord('certification-candidate', candidate)];

    // when
    const screen = await render(
      <template><SessionCandidates @certificationCandidates={{certificationCandidates}} /></template>,
    );

    // then
    assert.dom(screen.getByRole('cell', { name: certificationCandidates[0].lastName })).exists();
    assert.dom(screen.getByRole('cell', { name: certificationCandidates[0].firstName })).exists();
  });
});

function _buildCertificationCandidate({
  id = '12345',
  firstName = 'Eddy',
  lastName = 'Taurial',
  email = 'eddy.taurial@example.com',
  subscriptions = [],
}) {
  return {
    id,
    firstName,
    lastName,
    email,
    subscriptions,
  };
}
