import PixTable from '@1024pix/pix-ui/components/pix-table';
import PixTableColumn from '@1024pix/pix-ui/components/pix-table-column';
import { LinkTo } from '@ember/routing';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import dayjsFormat from 'ember-dayjs/helpers/dayjs-format';
import { t } from 'ember-intl';

export default class SessionCandidates extends Component {
  @service intl;

  computeSubscriptionsText = (candidate) => {
    const complementaryCertificationList = this.args.complementaryCertifications ?? [];
    const subscriptionLabels = [];

    if (candidate.hasDualCertificationSubscriptionCoreClea(complementaryCertificationList)) {
      subscriptionLabels.push(this.intl.t('pages.sessions.candidates.subscriptions.dual-core-clea'));
    } else {
      for (const subscription of candidate.subscriptions) {
        if (subscription.isCore)
          subscriptionLabels.unshift(this.intl.t('pages.sessions.candidates.subscriptions.core'));
        else {
          const candidateComplementaryCertification = complementaryCertificationList.find(
            (complementaryCertification) => complementaryCertification.id === subscription.complementaryCertificationId,
          );
          subscriptionLabels.push(candidateComplementaryCertification?.label || '-');
        }
      }
    }

    return subscriptionLabels.join(', ');
  };

  <template>
    {{#if @certificationCandidates}}
      <PixTable @data={{@certificationCandidates}} @variant="admin" @caption={{t "pages.sessions.candidates.caption"}}>
        <:columns as |candidate context|>
          <PixTableColumn @context={{context}} class="table__column--small">
            <:header>
              {{t "pages.sessions.candidates.candidate.id"}}
            </:header>
            <:cell>
              <LinkTo @route="authenticated.candidates.timeline" @model={{candidate.id}}>
                {{candidate.id}}
              </LinkTo>
            </:cell>
          </PixTableColumn>
          <PixTableColumn @context={{context}} class="table__column--small">
            <:header>
              {{t "pages.sessions.candidates.candidate.lastname"}}
            </:header>
            <:cell>
              {{candidate.lastName}}
            </:cell>
          </PixTableColumn>
          <PixTableColumn @context={{context}} class="table__column--small">
            <:header>
              {{t "pages.sessions.candidates.candidate.firstname"}}
            </:header>
            <:cell>
              {{candidate.firstName}}
            </:cell>
          </PixTableColumn>
          <PixTableColumn @context={{context}} class="table__column--small">
            <:header>
              {{t "pages.sessions.candidates.candidate.birth-date"}}
            </:header>
            <:cell>
              {{dayjsFormat candidate.birthdate "DD/MM/YYYY"}}
            </:cell>
          </PixTableColumn>
          <PixTableColumn @context={{context}} class="table__column">
            <:header>
              <span class="certification-candidates-table__selected-subscriptions">
                {{t "pages.sessions.candidates.candidate.selected-subscriptions"}}
              </span>
            </:header>
            <:cell>
              {{#each candidate.subscriptions as |subscription|}}
                {{#if subscription.isCore}}
                  <span>{{t "pages.sessions.candidates.subscriptions.core"}}</span>
                {{/if}}
                {{#if subscription.isComplementary}}
                  <span>, {{t "pages.sessions.candidates.subscriptions.complementary"}}</span>
                {{/if}}
              {{/each}}
            </:cell>
          </PixTableColumn>
        </:columns>
      </PixTable>
    {{else}}
      <div class="table__empty content-text">
        <p>{{t "pages.sessions.candidates.empty-result"}}</p>
      </div>
    {{/if}}
  </template>
}
