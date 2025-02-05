export const TYPES = {
  ORGANIZATION_LEARNER: 'organizationLearner',
  ORGANIZATION: 'organization',
  CAMPAIGN_PARTICIPATIONS: 'campaignParticipations',
};

export class Eligibility {
  constructor({ organizationLearner, organization, campaignParticipations = [] }) {
    this.organizationLearner = {
      id: organizationLearner?.id,
      MEFCode: organizationLearner?.MEFCode,
    };
    this.organization = organization;
    this.campaignParticipations = campaignParticipations;
  }

  /**
   * @param {number} campaignParticipationId
   */
  hasCampaignParticipation(campaignParticipationId) {
    return Boolean(
      this.campaignParticipations.find((campaignParticipation) => campaignParticipation.id === campaignParticipationId),
    );
  }

  /**
   * @param {number} campaignParticipationId
   */
  scoperALaParticipationUniquement({ campaignParticipationId }) {
    return new Eligibility({
      organizationLearner: this.organizationLearner,
      organization: this.organization,
      campaignParticipations: this.campaignParticipations.filter((cp) => cp.id === campaignParticipationId),
    });
  }
}
