import Controller from '@ember/controller';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

const IDENTITY_PROVIDER_ID_GAR = 'GAR';

export default class FillInCampaignCodeController extends Controller {
  @service intl;
  @service locale;
  @service router;
  @service session;
  @service store;

  @tracked apiErrorMessage = null;
  @tracked showGARModal = false;
  @tracked campaign = null;
  @tracked selectedLanguage = this.intl.primaryLocale;

  get isUserAuthenticatedByPix() {
    return this.session.isAuthenticated;
  }

  get isUserAuthenticatedByGAR() {
    return this.session.isAuthenticatedByGar;
  }

  @action
  async clearErrors() {
    this.apiErrorMessage = null;
  }

  @action
  async startCampaign(campaignCode) {
    try {
      const verifiedCode = await this.store.findRecord('verified-code', campaignCode);
      this.campaign = await this.verifiedCode.campaign;
      const organizationToJoin = await this.store.queryRecord('organization-to-join', { code: this.verifiedCode.id });
      const isGARCampaign = organizationToJoin.identityProvider === IDENTITY_PROVIDER_ID_GAR;
      if (_shouldShowGARModal(isGARCampaign, this.isUserAuthenticatedByGAR, this.isUserAuthenticatedByPix)) {
        this.showGARModal = true;
        return;
      }

      if (verifiedCode.type === 'campaign') {
        this.campaign = await verifiedCode.campaign;
        this.router.transitionTo('campaigns.entry-point', verifiedCode.id);
      } else {
        this.router.transitionTo('combined-courses', verifiedCode.id);
      }
    } catch (error) {
      this.onStartCampaignError(error);
    }
  }

  onStartCampaignError(error) {
    const { status } = error.errors[0];
    if (status === '403') {
      this.apiErrorMessage = this.intl.t('pages.fill-in-campaign-code.errors.forbidden');
    } else if (status === '404') {
      this.apiErrorMessage = this.intl.t('pages.fill-in-campaign-code.errors.not-found');
    } else {
      throw error;
    }
  }

  @action
  closeModal() {
    this.showGARModal = false;
  }

  @action
  onLanguageChange(language) {
    this.selectedLanguage = language;
    this.locale.setLocale(this.selectedLanguage);
    this.router.replaceWith('fill-in-campaign-code', { queryParams: { lang: null } });
  }
}

function _shouldShowGARModal(isGARCampaign, isUserAuthenticatedByGAR, isUserAuthenticatedByPix) {
  if (!isGARCampaign) {
    return false;
  }

  if (isUserAuthenticatedByGAR) {
    return false;
  }

  if (isUserAuthenticatedByPix) {
    return false;
  }

  return true;
}
