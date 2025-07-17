import PixBlock from '@1024pix/pix-ui/components/pix-block';
import PixButtonLink from '@1024pix/pix-ui/components/pix-button-link';
import PixNotificationAlert from '@1024pix/pix-ui/components/pix-notification-alert';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { t } from 'ember-intl';

import FrameworkDetails from './framework/framework-details';

export default class ComplementaryCertificationFramework extends Component {
  @service store;
  @service router;
  @tracked currentConsolidatedFramework;

  constructor() {
    super(...arguments);

    this.#onMount();
  }

  async #onMount() {
    const routeParams = this.router.currentRoute.parent.parent.params;

    const complementaryCertification = await this.store.peekRecord(
      'complementary-certification',
      routeParams.complementary_certification_id,
    );

    this.currentConsolidatedFramework = await this.store.findRecord(
      'certification-consolidated-framework',
      complementaryCertification.key,
    );
  }

  <template>
    <PixBlock @variant="admin">
      {{#unless this.currentConsolidatedFramework}}
        <PixNotificationAlert @withIcon={{true}} class="framework__no-current">
          {{t "components.complementary-certifications.item.framework.no-current-framework"}}
        </PixNotificationAlert>
        <br />
      {{/unless}}

      <PixButtonLink
        class="framework__creation-button"
        @route="authenticated.complementary-certifications.item.framework.new"
      >
        {{t "components.complementary-certifications.item.framework.create-button"}}
      </PixButtonLink>
    </PixBlock>

    {{#if this.currentConsolidatedFramework}}
      <FrameworkDetails @currentConsolidatedFramework={{this.currentConsolidatedFramework}} />
    {{/if}}
  </template>
}
