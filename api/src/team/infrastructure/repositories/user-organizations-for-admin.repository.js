import { DomainTransaction } from '../../../shared/domain/DomainTransaction.js';
import { UserOrganizationForAdmin } from '../../domain/read-models/UserOrganizationForAdmin.js';

const findByUserId = async function (userId) {
  const trx = DomainTransaction.getConnection();

  const organizations = await trx('memberships')
    .select({
      id: 'memberships.id',
      organizationRole: 'memberships.organizationRole',
      organizationId: 'memberships.organizationId',
      organizationName: 'organizations.name',
      organizationType: 'organizations.type',
      organizationExternalId: 'organizations.externalId',
      lastAccessedAt: 'memberships.lastAccessedAt',
    })
    .innerJoin('organizations', 'organizations.id', 'memberships.organizationId')
    .where('memberships.userId', userId)
    .whereNull('memberships.disabledAt');

  return organizations.map((attributes) => new UserOrganizationForAdmin(attributes));
};

export const userOrganizationsForAdminRepository = { findByUserId };
