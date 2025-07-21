import PixButton from '@1024pix/pix-ui/components/pix-button';
import PixButtonLink from '@1024pix/pix-ui/components/pix-button-link';
import PixNotificationAlert from '@1024pix/pix-ui/components/pix-notification-alert';
import PixTag from '@1024pix/pix-ui/components/pix-tag';
import { action } from '@ember/object';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import dayjsFormat from 'ember-dayjs/helpers/dayjs-format';
import { t } from 'ember-intl';

import { assessmentResultStatus } from '../../../models/certification';

export default class Item extends Component {
  @service intl;
  @service session;
  @service fileSaver;
  @service currentDomain;
  @service locale;

  @tracked errorMessage = null;

  get isPublished() {
    return this.args.certification.isPublished;
  }

  get isNotPublished() {
    return !this.isPublished;
  }

  get isCancelled() {
    return this.args.certification.status === assessmentResultStatus.CANCELLED && this.isPublished;
  }

  get isRejected() {
    return this.args.certification.status === assessmentResultStatus.REJECTED && this.isPublished;
  }

  get isValidated() {
    return this.args.certification.status === assessmentResultStatus.VALIDATED && this.isPublished;
  }

  get tagInformation() {
    if (this.isNotPublished) {
      return { color: 'blue', content: this.intl.t('pages.certifications-list.statuses.not-published') };
    }
    if (this.isRejected) {
      return { color: 'error', content: this.intl.t('pages.certifications-list.statuses.rejected') };
    }
    if (this.isCancelled) {
      return { color: 'error', content: this.intl.t('pages.certifications-list.statuses.cancelled') };
    }
    return { color: 'green', content: this.intl.t('pages.certifications-list.statuses.validated') };
  }

  get notObtainedCertificationWithComment() {
    return (this.isRejected || this.isCancelled) && this.args.certification.commentForCandidate && this.isPublished;
  }

  get pixScore() {
    return this.isValidated ? this.args.certification.pixScore : '-';
  }

  get downloadLabel() {
    if (this.args.certification.algorithmEngineVersion === 3) {
      return this.intl.t('pages.certifications-list.buttons.download-certificate');
    }
    return this.intl.t('pages.certifications-list.buttons.download-attestation');
  }

  @action
  async downloadAttestation() {
    this.errorMessage = null;
    const certificationId = this.args.certification.id;
    const lang = this.locale.currentLocale;

    const url = `/api/attestation/${certificationId}?isFrenchDomainExtension=${this.currentDomain.isFranceDomain}&lang=${lang}`;

    const token = this.session.data.authenticated.access_token;
    try {
      await this.fileSaver.save({ url, token });
    } catch {
      this.errorMessage = this.intl.t('common.error');
    }
  }

  <template>
    <div class="certification-item">
      <div class="certification-item__information">
        <PixTag @color={{this.tagInformation.color}}>{{this.tagInformation.content}}</PixTag>
        <ul>
          <li class="certification-item-information--bold">
            {{t "pages.certifications-list.information.certification-center"}}
            {{@certification.certificationCenter}}
          </li>
          <li>
            {{t "pages.certifications-list.information.date"}}
            {{dayjsFormat @certification.date "DD/MM/YYYY"}}
          </li>
        </ul>
      </div>
      <div class="certification-item__hexagon">
        <p>{{this.pixScore}}</p>
      </div>
    </div>
    <div>
      {{#if this.notObtainedCertificationWithComment}}
        <p class="certification-item-comment">{{t "pages.certifications-list.comment"}}
          {{@certification.commentForCandidate}}</p>

      {{/if}}
      {{#if this.isValidated}}
        {{#if this.errorMessage}}
          <PixNotificationAlert @type="error" @withIcon={{true}} class="certification-item-error">
            <p>{{this.errorMessage}}</p>
          </PixNotificationAlert>
        {{/if}}

        <ul class="certification-item-buttons">
          <li>
            <PixButtonLink
              @variant="secondary"
              @route="authenticated.user-certifications.get"
              @model={{@certification.id}}
              @iconBefore="eye"
            >
              {{t "pages.certifications-list.buttons.details"}}
            </PixButtonLink>
          </li>
          <li>
            <PixButton
              @triggerAction={{this.downloadAttestation}}
              @loadingColor="grey"
              @iconBefore="download"
              @variant="tertiary"
            >
              {{this.downloadLabel}}
            </PixButton>
          </li>
        </ul>
      {{/if}}
    </div>
  </template>
}
