import { render } from '@1024pix/ember-testing-library';
import Service from '@ember/service';
import { t } from 'ember-intl/test-support';
import ResultLevelGauge from 'pix-orga/components/statistics/result-level-gauge';
import { module, test } from 'qunit';

import setupIntlRenderingTest from '../../../helpers/setup-intl-rendering';

module('Integration | Component | Statistics | ResultLevelGauge', function (hooks) {
  setupIntlRenderingTest(hooks);
  module('label', function () {
    test('it should display default label', async function (assert) {
      //given
      const maxLevel = 4.245;
      const meanLevel = 3.756;

      //when
      const screen = await render(
        <template><ResultLevelGauge @maxLevel={{maxLevel}} @meanLevel={{meanLevel}} /></template>,
      );

      //then
      assert.ok(screen.getByLabelText(t('pages.analysis.gauge.label', { maxLevel: 4.2, meanLevel: 3.8 })));
    });
    test('it should display given label', async function (assert) {
      //given
      const maxLevel = 4.245;
      const meanLevel = 3.756;

      //when
      const screen = await render(
        <template>
          <ResultLevelGauge
            @maxLevel={{maxLevel}}
            @meanLevel={{meanLevel}}
            @labelI18nKey="pages.analysis.gauge.tube-label"
          />
        </template>,
      );

      //then
      assert.ok(screen.getByLabelText(t('pages.analysis.gauge.tube-label', { maxLevel: 4.2, meanLevel: 3.8 })));
    });
  });

  test('it should display rounded values', async function (assert) {
    //given
    const maxLevel = 4.245;
    const meanLevel = 3.756;

    //when
    const screen = await render(
      <template><ResultLevelGauge @maxLevel={{maxLevel}} @meanLevel={{meanLevel}} /></template>,
    );

    //then
    assert.ok(screen.getByText('3.8'));
    assert.ok(screen.getByText('4.2'));
  });

  test('it should display values without trailing zero', async function (assert) {
    //given
    const maxLevel = 4.001;
    const meanLevel = 2.999;

    //when
    const screen = await render(
      <template><ResultLevelGauge @maxLevel={{maxLevel}} @meanLevel={{meanLevel}} /></template>,
    );

    //then
    assert.ok(screen.getByText('3'));
    assert.ok(screen.getByText('4'));
  });
});
