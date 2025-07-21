import { render } from '@1024pix/ember-testing-library';
import { click } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { t } from 'ember-intl/test-support';
import { module, test } from 'qunit';
import sinon from 'sinon';

import setupIntlRenderingTest from '../../../helpers/setup-intl-rendering.js';

module('Integration | Component | combined course', function (hooks) {
  setupIntlRenderingTest(hooks);

  module('when participation has not been started yet', function () {
    test('should display start button', async function (assert) {
      // given
      const store = this.owner.lookup('service:store');
      const combinedCourse = store.createRecord('combined-course', { id: 1, status: 'not-started', code: 'COMBINIX9' });
      this.setProperties({ combinedCourse });

      // when
      const screen = await render(hbs`
        <Routes::CombinedCourses @combinedCourse={{this.combinedCourse}}  />`);

      // then
      assert.ok(screen.getByRole('button', { name: t('pages.combined-courses.content.start-button') }));
    });
    test('when clicking start button, should create quest participation', async function (assert) {
      // given
      const store = this.owner.lookup('service:store');
      const combinedCourse = store.createRecord('combined-course', { id: 1, status: 'not-started', code: 'COMBINIX9' });
      sinon.stub(combinedCourse, 'reload').callsFake(() => {
        combinedCourse.status = 'started';
      });
      this.setProperties({ combinedCourse });
      sinon.stub(store, 'adapterFor');

      store.adapterFor.withArgs('combined-course').returns({ start: sinon.stub().withArgs('COMBINIX9').resolves() });

      // when
      const screen = await render(hbs`
        <Routes::CombinedCourses @combinedCourse={{this.combinedCourse}}  />`);

      await click(screen.getByRole('button', { name: t('pages.combined-courses.content.start-button') }));

      // then
      assert.notOk(screen.queryByRole('button', { name: t('pages.combined-courses.content.start-button') }));
    });
  });
});
