import { knex } from '../../../../../db/knex-database-connection.js';
import { DomainTransaction } from '../../../../shared/domain/DomainTransaction.js';
import { Assessment } from '../../../../shared/domain/models/Assessment.js';
import { CampaignTypes } from '../../../shared/domain/constants.js';
import { CampaignParticipationForUserManagement } from '../../domain/models/CampaignParticipationForUserManagement.js';

const findByUserId = async function (userId) {
  const trx = DomainTransaction.getConnection();
  const campaignParticipations = await trx
    .with(
      'participations',
      trx('assessments')
        .select({
          campaignParticipationId: 'campaign-participations.id',
          participantExternalId: 'campaign-participations.participantExternalId',
          status: 'campaign-participations.status',
          campaignId: 'campaigns.id',
          campaignCode: 'campaigns.code',
          createdAt: knex.raw('COALESCE("campaign-participations"."createdAt", assessments."createdAt")'),
          sharedAt: 'campaign-participations.sharedAt',
          deletedAt: 'campaign-participations.deletedAt',
          updatedAt: 'assessments.updatedAt',
          organizationLearnerFirstName: 'view-active-organization-learners.firstName',
          organizationLearnerLastName: 'view-active-organization-learners.lastName',
        })
        .leftJoin('campaign-participations', 'assessments.campaignParticipationId', 'campaign-participations.id')
        .leftJoin('campaigns', 'campaigns.id', 'campaign-participations.campaignId')
        .leftJoin(
          'view-active-organization-learners',
          'view-active-organization-learners.id',
          'campaign-participations.organizationLearnerId',
        )
        .where('assessments.userId', userId)
        .where('assessments.isImproving', false)
        .where('assessments.type', Assessment.types.CAMPAIGN)
        .union(function () {
          // using UNION will remove lines having the exact same attibutes
          this.select({
            campaignParticipationId: 'campaign-participations.id',
            participantExternalId: 'campaign-participations.participantExternalId',
            status: 'campaign-participations.status',
            campaignId: 'campaigns.id',
            campaignCode: 'campaigns.code',
            createdAt: 'campaign-participations.createdAt',
            sharedAt: 'campaign-participations.sharedAt',
            deletedAt: 'campaign-participations.deletedAt',
            updatedAt: 'campaign-participations.deletedAt',
            organizationLearnerFirstName: 'view-active-organization-learners.firstName',
            organizationLearnerLastName: 'view-active-organization-learners.lastName',
          })
            .from('campaign-participations')
            .leftJoin('campaigns', 'campaigns.id', 'campaign-participations.campaignId')
            .leftJoin(
              'view-active-organization-learners',
              'view-active-organization-learners.id',
              'campaign-participations.organizationLearnerId',
            )
            .where({ 'campaign-participations.userId': userId, type: CampaignTypes.PROFILES_COLLECTION });
        }),
    )
    .select([
      'campaignParticipationId',
      'participantExternalId',
      'status',
      'campaignId',
      'campaignCode',
      'createdAt',
      'sharedAt',
      'deletedAt',
      'updatedAt',
      'organizationLearnerFirstName',
      'organizationLearnerLastName',
    ])
    .from('participations')
    .orderBy('createdAt', 'desc')
    .orderBy('campaignCode', 'asc')
    .orderBy('sharedAt', 'desc');

  return campaignParticipations.map((attributes) => new CampaignParticipationForUserManagement(attributes));
};

export { findByUserId };
