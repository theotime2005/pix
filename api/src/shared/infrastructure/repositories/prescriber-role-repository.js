import { knex } from '../../../../db/knex-database-connection.js';
import { DomainTransaction } from '../../../shared/domain/DomainTransaction.js';
import { prescriberRoles } from '../../application/pre-handlers/CampaignAuthorization.js';

const getForCampaign = async function ({ userId, campaignId }) {
  const result = await _getCampaignAccess({ userId, campaignId });

  if (!result) return null;

  let prescriberRole = result.organizationRole;
  if (userId === result.ownerId) {
    prescriberRole = prescriberRoles.OWNER;
  }
  return prescriberRole;
};

export { getForCampaign };

function _getCampaignAccess({ campaignId, userId }) {
  const trx = DomainTransaction.getConnection();
  return trx('campaigns')
    .select('ownerId', 'memberships.organizationRole')
    .join('memberships', function () {
      this.on('memberships.organizationId', 'campaigns.organizationId')
        .andOnVal('userId', userId)
        .andOnVal('disabledAt', knex.raw('IS'), knex.raw('NULL'));
    })
    .where('campaigns.id', campaignId)
    .first();
}
