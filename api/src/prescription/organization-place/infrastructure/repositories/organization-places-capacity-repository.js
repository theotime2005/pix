import { DomainTransaction } from '../../../../shared/domain/DomainTransaction.js';
import { OrganizationPlacesCapacity } from '../../domain/read-models/OrganizationPlacesCapacity.js';

async function findByOrganizationId(organizationId) {
  const now = new Date();
  const trx = DomainTransaction.getConnection();

  const organizationPlacesLots = await trx('organization-places')
    .select('category', 'count')
    .where({ organizationId })
    .where('activationDate', '<', now)
    .whereNull('deletedAt')
    .where(function () {
      this.where('expirationDate', '>', now).orWhereNull('expirationDate');
    });

  return new OrganizationPlacesCapacity({ placesLots: organizationPlacesLots, organizationId });
}

export { findByOrganizationId };
