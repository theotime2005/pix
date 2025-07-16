import _ from 'lodash';

import { DomainTransaction } from '../../../shared/domain/DomainTransaction.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import { OrganizationInvitation } from '../../domain/models/OrganizationInvitation.js';

/**
 * @param {Object} params
 * @param {string} params.organizationId
 * @param {string} params.email
 * @param {string} params.code
 * @param {string} params.role
 * @param {string} params.locale
 * @returns {Promise<OrganizationInvitation>}
 */
const create = async function ({ organizationId, email, code, role, locale }) {
  const status = OrganizationInvitation.StatusType.PENDING;
  const trx = DomainTransaction.getConnection();

  const [organizationInvitationCreated] = await trx('organization-invitations')
    .insert({ organizationId, email, status, code, role, locale })
    .returning('*');

  return new OrganizationInvitation(organizationInvitationCreated);
};

/**
 * @param {string} id
 * @returns {Promise<OrganizationInvitation>}
 */
const get = async function (id) {
  const trx = DomainTransaction.getConnection();
  const organizationInvitation = await trx('organization-invitations').where('id', id).first();
  if (!organizationInvitation) throw new NotFoundError(`Not found organization-invitation for ID ${id}`);
  return new OrganizationInvitation(organizationInvitation);
};

/**
 * @param {Object} params
 * @param {string} params.id
 * @param {string} params.code
 * @returns {Promise<OrganizationInvitation>}
 */
const getByIdAndCode = async function ({ id, code }) {
  const trx = DomainTransaction.getConnection();
  const organizationInvitation = await trx('organization-invitations').where({ id, code }).first();
  if (!organizationInvitation)
    throw new NotFoundError(`Not found organization-invitation for ID ${id} and code ${code}`);
  return new OrganizationInvitation(organizationInvitation);
};

/**
 * @param {string} id
 * @returns {Promise<OrganizationInvitation>}
 */
const markAsAccepted = async function (id) {
  const status = OrganizationInvitation.StatusType.ACCEPTED;
  const trx = DomainTransaction.getConnection();
  const [organizationInvitationAccepted] = await trx('organization-invitations')
    .where({ id })
    .update({ status, updatedAt: new Date() })
    .returning('*');
  if (!organizationInvitationAccepted) throw new NotFoundError(`Not found organization-invitation for ID ${id}`);
  return new OrganizationInvitation(organizationInvitationAccepted);
};

/**
 * @param {Object} params
 * @param {string} params.id
 * @returns {Promise<OrganizationInvitation>}
 */
const markAsCancelled = async function ({ id }) {
  const trx = DomainTransaction.getConnection();
  const [organizationInvitation] = await trx('organization-invitations')
    .where({ id })
    .update({
      status: OrganizationInvitation.StatusType.CANCELLED,
      updatedAt: new Date(),
    })
    .returning('*');

  if (!organizationInvitation) {
    throw new NotFoundError(`Organization invitation of id ${id} is not found.`);
  }
  return new OrganizationInvitation(organizationInvitation);
};

/**
 * @param {Object} params
 * @param {string} params.organizationId
 * @returns {Promise<OrganizationInvitation>}
 */
const findPendingByOrganizationId = async function ({ organizationId }) {
  const trx = DomainTransaction.getConnection();
  const pendingOrganizationInvitations = await trx('organization-invitations')
    .where({ organizationId, status: OrganizationInvitation.StatusType.PENDING })
    .orderBy('updatedAt', 'desc');
  return pendingOrganizationInvitations.map((pendingOrganizationInvitation) => {
    return new OrganizationInvitation(pendingOrganizationInvitation);
  });
};

/**
 * @param {Object} params
 * @param {string} params.organizationId
 * @param {string} params.email
 * @returns {Promise<OrganizationInvitation>}
 */
const findOnePendingByOrganizationIdAndEmail = async function ({ organizationId, email }) {
  const trx = DomainTransaction.getConnection();
  const pendingOrganizationInvitation = await trx('organization-invitations')
    .where({ organizationId, status: OrganizationInvitation.StatusType.PENDING })
    .whereRaw('LOWER("email") = ?', `${email.toLowerCase()}`)
    .first();
  if (!pendingOrganizationInvitation) return null;
  return new OrganizationInvitation(pendingOrganizationInvitation);
};

/**
 * @param {string} id
 * @returns {Promise<OrganizationInvitation>}
 */
const updateModificationDate = async function (id) {
  const trx = DomainTransaction.getConnection();
  const organizationInvitation = await trx('organization-invitations')
    .where({ id })
    .update({ updatedAt: new Date() })
    .returning('*')
    .then(_.first);

  if (!organizationInvitation) {
    throw new NotFoundError(`Organization invitation of id ${id} is not found.`);
  }
  return new OrganizationInvitation(organizationInvitation);
};

/**
 * @param organizationInvitation
 * @returns {Promise<OrganizationInvitation>}
 */
const update = async function (organizationInvitation) {
  const trx = DomainTransaction.getConnection();
  const [updatedOrganizationInvitation] = await trx('organization-invitations')
    .where({ id: organizationInvitation.id })
    .update({
      ...organizationInvitation,
      updatedAt: new Date(),
    })
    .returning('*');

  if (!updatedOrganizationInvitation) {
    throw new NotFoundError(`Organization invitation of id ${organizationInvitation.id} is not found.`);
  }
  return new OrganizationInvitation(updatedOrganizationInvitation);
};

export const organizationInvitationRepository = {
  create,
  findOnePendingByOrganizationIdAndEmail,
  findPendingByOrganizationId,
  get,
  getByIdAndCode,
  markAsAccepted,
  markAsCancelled,
  updateModificationDate,
  update,
};
