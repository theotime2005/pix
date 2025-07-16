import { knex } from '../../../../../db/knex-database-connection.js';
import { DomainTransaction } from '../../../../shared/domain/DomainTransaction.js';
import { Division } from '../../domain/models/Division.js';

async function findByCampaignId(campaignId) {
  const trx = DomainTransaction.getConnection();
  const divisions = await trx('view-active-organization-learners')
    .where({ campaignId })
    .whereNotNull('division')
    .where({ 'campaign-participations.deletedAt': null })
    .distinct('division')
    .orderBy('division', 'asc')
    .join(
      'campaign-participations',
      'view-active-organization-learners.id',
      'campaign-participations.organizationLearnerId',
    );

  return divisions.map(({ division }) => _toDomain(division));
}

async function findByOrganizationIdForCurrentSchoolYear({ organizationId }) {
  const trx = DomainTransaction.getConnection();
  const divisionRows = await trx('view-active-organization-learners')
    .distinct('division')
    .where({ organizationId, isDisabled: false })
    .whereNotNull('division')
    .orderBy('division', 'asc');

  return divisionRows.map(({ division }) => _toDomain(division));
}

function _toDomain(division) {
  return new Division({ name: division });
}

export { findByCampaignId, findByOrganizationIdForCurrentSchoolYear };
