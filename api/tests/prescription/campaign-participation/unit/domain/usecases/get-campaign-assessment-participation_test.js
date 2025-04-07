import { getCampaignAssessmentParticipation } from '../../../../../../src/prescription/campaign-participation/domain/usecases/get-campaign-assessment-participation.js';
import { DomainTransaction } from '../../../../../../src/shared/domain/DomainTransaction.js';
import { UserNotAuthorizedToAccessEntityError } from '../../../../../../src/shared/domain/errors.js';
import { catchErr, domainBuilder, expect, sinon } from '../../../../../test-helper.js';

describe('Unit | UseCase | get-campaign-assessment-participation', function () {
  let campaignRepository;
  let campaignAssessmentParticipationRepository;
  let badgeAcquisitionRepository;
  let stageCollectionRepository;
  let userId, campaignId, campaignParticipationId;

  beforeEach(function () {
    sinon.stub(DomainTransaction, 'execute').callsFake((lambda) => lambda());
    stageCollectionRepository = { findStageCollection: sinon.stub() };
    stageCollectionRepository.findStageCollection.resolves(domainBuilder.buildStageAcquisitionCollection());
    campaignRepository = {
      checkIfUserOrganizationHasAccessToCampaign: sinon.stub(),
      get: sinon.stub(),
    };
    campaignAssessmentParticipationRepository = {
      getByCampaignIdAndCampaignParticipationId: sinon.stub(),
    };
    badgeAcquisitionRepository = {
      getAcquiredBadgesByCampaignParticipations: sinon.stub(),
    };
  });

  context('when user does not have access to organization that owns campaign', function () {
    beforeEach(function () {
      userId = domainBuilder.buildUser().id;
      const campaign = domainBuilder.buildCampaign();
      campaignId = campaign.id;
      campaignParticipationId = domainBuilder.buildCampaignParticipation({ campaign, userId }).id;
      campaignRepository.checkIfUserOrganizationHasAccessToCampaign.withArgs(campaignId, userId).resolves(false);
    });

    it('should throw UserNotAuthorizedToAccessEntityError', async function () {
      // when
      const result = await catchErr(getCampaignAssessmentParticipation)({
        userId,
        campaignId,
        campaignParticipationId,
        campaignRepository,
        campaignAssessmentParticipationRepository,
        badgeAcquisitionRepository,
        stageCollectionRepository,
      });

      // then
      expect(result).to.be.instanceOf(UserNotAuthorizedToAccessEntityError);
      expect(campaignRepository.get.called).to.be.false;
      expect(campaignAssessmentParticipationRepository.getByCampaignIdAndCampaignParticipationId.called).to.be.false;
      expect(badgeAcquisitionRepository.getAcquiredBadgesByCampaignParticipations.called).to.be.false;
    });
  });
});
