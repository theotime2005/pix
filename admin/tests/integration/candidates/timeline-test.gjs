import { render } from '@1024pix/ember-testing-library';
import Timeline from 'pix-admin/components/candidates/timeline';
import { module, test } from 'qunit';

import setupIntlRenderingTest, { t } from '../../helpers/setup-intl-rendering';

module('Integration | Component | Candidates | Timeline', function (hooks) {
  setupIntlRenderingTest(hooks);

  let store;

  hooks.beforeEach(async function () {
    store = this.owner.lookup('service:store');
  });

  test('it should display events', async function (assert) {
    // given
    const dayjsService = this.owner.lookup('service:dayjs');
    const timeline = store.createRecord('certification-candidate-timeline', {
      events: [{ code: 'ComplementaryCertifiableEvent', when: new Date(), metadata: {} }],
    });
    const formattedDate = dayjsService.self(timeline.events[0].when).format('DD/MM/YYYY [-] HH:mm:ss [[].SSS]');

    // when
    const screen = await render(<template><Timeline @timeline={{timeline}} /></template>);

    // then
    assert.dom(screen.getByRole('cell', { name: t('pages.candidate.events.ComplementaryCertifiableEvent') })).exists();
    assert.dom(screen.getByRole('cell', { name: formattedDate })).exists();
    assert.dom(screen.getByRole('cell', { name: '{}' })).exists();
  });
});
