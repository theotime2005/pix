import { DomainTransaction } from '../../../../shared/domain/DomainTransaction.js';

const update = async function (targetProfile) {
  const trx = DomainTransaction.getConnection();
  const results = await trx('target-profile-shares')
    .where('targetProfileId', targetProfile.id)
    .whereIn('organizationId', targetProfile.organizationIdsToDetach)
    .del()
    .returning('organizationId');
  return results.map(({ organizationId }) => organizationId);
};

export { update };
