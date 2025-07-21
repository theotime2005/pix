import PixButton from '@1024pix/pix-ui/components/pix-button';
import { action } from '@ember/object';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { t } from 'ember-intl';
import eq from 'ember-truth-helpers/helpers/eq';

export default class CombinedCourses extends Component {
  <template>
    {{#if (eq @combinedCourse.status "not-started")}}
      <PixButton @type="submit" @triggerAction={{this.startQuestParticipation}} @loading-color="white" @size="large">{{t
          "pages.combined-courses.content.start-button"
        }}
      </PixButton>
    {{/if}}
  </template>

  @service currentUser;
  @service session;
  @service featureToggles;
  @service intl;
  @service store;

  @action
  async startQuestParticipation() {
    const combinedCourseAdapter = this.store.adapterFor('combined-course');
    await combinedCourseAdapter.start(this.args.combinedCourse.code);
    this.args.combinedCourse.reload();
  }
}
