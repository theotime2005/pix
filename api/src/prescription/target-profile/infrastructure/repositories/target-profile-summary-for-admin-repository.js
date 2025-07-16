import { DomainTransaction } from '../../../../shared/domain/DomainTransaction.js';
import { fetchPage } from '../../../../shared/infrastructure/utils/knex-utils.js';
import { TargetProfileSummaryForAdmin } from '../../domain/models/TargetProfileSummaryForAdmin.js';

const findPaginatedFiltered = async function ({ filter, page }) {
  const trx = DomainTransaction.getConnection();
  const query = trx('target-profiles')
    .select('id', 'internalName', 'outdated', 'category', 'createdAt')
    .orderBy('outdated', 'ASC')
    .orderBy('internalName', 'ASC')
    .modify(_applyFilters, filter);

  const { results, pagination } = await fetchPage(query, page);

  const targetProfileSummaries = results.map((attributes) => new TargetProfileSummaryForAdmin(attributes));
  return { models: targetProfileSummaries, meta: { ...pagination } };
};

const findByTraining = async function ({ trainingId }) {
  const knexConn = DomainTransaction.getConnection();

  const results = await knexConn('target-profiles')
    .select({
      id: 'target-profiles.id',
      internalName: 'target-profiles.internalName',
      outdated: 'target-profiles.outdated',
      ownerOrganizationId: 'target-profiles.ownerOrganizationId',
    })
    .innerJoin('target-profile-trainings', 'target-profiles.id', 'target-profile-trainings.targetProfileId')
    .where({ trainingId })
    .orderBy('id', 'ASC');

  return results.map((attributes) => new TargetProfileSummaryForAdmin(attributes));
};

export { findByTraining, findPaginatedFiltered };

function _applyFilters(qb, filter) {
  const { internalName, id, categories } = filter;
  if (internalName) {
    qb.whereILike('internalName', `%${internalName}%`);
  }
  if (id) {
    qb.where({ id });
  }
  if (categories) {
    qb.whereIn('category', categories);
  }
  return qb;
}
