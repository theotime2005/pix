import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class ProfilesCollectionCampaignsStartOrResumeRoute extends Route {
  @service session;
  @service router;

  buildRouteInfoMetadata() {
    return { doNotTrackPage: true };
  }

  beforeModel(transition) {
    this.session.requireAuthenticationAndApprovedTermsOfService(transition);
  }

  async model() {
    return this.modelFor('campaigns.profiles-collection');
  }

  async redirect({ campaign, campaignParticipation }) {
    campaignParticipation.isShared = true;
    await campaignParticipation.save();

    return this.router.replaceWith('campaigns.profiles-collection.profile-already-shared', campaign.code);
  }
}
