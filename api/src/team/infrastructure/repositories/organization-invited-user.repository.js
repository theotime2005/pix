import { DomainTransaction } from '../../../shared/domain/DomainTransaction.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import { OrganizationInvitedUser } from '../../domain/models/OrganizationInvitedUser.js';

const get = async function ({ organizationInvitationId, email }) {
  const trx = DomainTransaction.getConnection();
  const invitation = await trx('organization-invitations')
    .select('id', 'organizationId', 'code', 'role', 'status')
    .where({ id: organizationInvitationId })
    .first();
  if (!invitation) {
    throw new NotFoundError(`Not found organization-invitation for ID ${organizationInvitationId}`);
  }

  const user = await trx('users').select('id').where({ email }).first();
  if (!user) {
    throw new NotFoundError(`Not found user for email ${email}`);
  }

  const memberships = await trx('memberships')
    .select('id', 'userId', 'organizationRole')
    .where({
      organizationId: invitation.organizationId,
      disabledAt: null,
    })
    .orderBy('id', 'ASC');

  const existingMembership = memberships.find((membership) => membership.userId === user.id);

  return new OrganizationInvitedUser({
    userId: user.id,
    invitation,
    currentMembershipId: existingMembership?.id,
    currentRole: existingMembership?.organizationRole,
    organizationHasMemberships: memberships.length,
    status: invitation.status,
  });
};

const save = async function ({ organizationInvitedUser }) {
  const date = new Date();
  const trx = DomainTransaction.getConnection();
  if (organizationInvitedUser.isAlreadyMemberOfOrganization) {
    await trx('memberships')
      .update({
        organizationRole: organizationInvitedUser.currentRole,
        updatedAt: date,
      })
      .where({ id: organizationInvitedUser.currentMembershipId });
  } else {
    const [{ id: membershipId }] = await trx('memberships')
      .insert({
        organizationRole: organizationInvitedUser.currentRole,
        organizationId: organizationInvitedUser.invitation.organizationId,
        userId: organizationInvitedUser.userId,
      })
      .returning('id');

    organizationInvitedUser.currentMembershipId = membershipId;
  }

  await trx('user-orga-settings')
    .insert({
      userId: organizationInvitedUser.userId,
      currentOrganizationId: organizationInvitedUser.invitation.organizationId,
      updatedAt: new Date(),
    })
    .onConflict('userId')
    .merge();

  await trx('organization-invitations')
    .update({ status: organizationInvitedUser.status, updatedAt: date })
    .where({ id: organizationInvitedUser.invitation.id });
};

const organizationInvitedUserRepository = { get, save };
export { organizationInvitedUserRepository };
