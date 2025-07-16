import { DomainTransaction } from '../../../shared/domain/DomainTransaction.js';
import { UserOrgaSettingsCreationError } from '../../../shared/domain/errors.js';
import { Organization, User } from '../../../shared/domain/models/index.js';
import { UserOrgaSettings } from '../../../shared/domain/models/UserOrgaSettings.js';
import * as knexUtils from '../../../shared/infrastructure/utils/knex-utils.js';

/**
 * @param {string} userId
 * @return {Promise<{}|UserOrgaSettings>}
 */
const findOneByUserId = async function (userId) {
  const trx = DomainTransaction.getConnection();

  const userOrgaSettings = await trx('user-orga-settings').where({ userId }).first();
  if (!userOrgaSettings) return {};

  const user = await trx('users').where('id', userId).first();
  const currentOrganization = await trx('organizations').where('id', userOrgaSettings.currentOrganizationId).first();

  return new UserOrgaSettings({
    id: userOrgaSettings.id,
    currentOrganization: new Organization(currentOrganization),
    user: new User(user),
  });
};

/**
 * @param {string} userId
 * @param {string} currentOrganizationId
 * @return {Promise<UserOrgaSettings>}
 */
const create = async function (userId, currentOrganizationId) {
  const trx = DomainTransaction.getConnection();

  try {
    const [userOrgaSettingsCreated] = await trx('user-orga-settings')
      .insert({ userId, currentOrganizationId, createdAt: new Date() })
      .returning('*');
    const user = await trx('users').where('id', userId).first();
    const currentOrganization = await trx('organizations')
      .where('id', userOrgaSettingsCreated.currentOrganizationId)
      .first();

    return new UserOrgaSettings({
      id: userOrgaSettingsCreated.id,
      user: new User(user),
      currentOrganization: new Organization(currentOrganization),
    });
  } catch (err) {
    if (knexUtils.isUniqConstraintViolated(err)) {
      throw new UserOrgaSettingsCreationError(err.message);
    }
    throw err;
  }
};

/**
 * @param {string} userId
 * @param {string} organizationId
 * @return {Promise<UserOrgaSettings>}
 */
const update = async function (userId, organizationId) {
  const trx = DomainTransaction.getConnection();

  const [userOrgaSettingsUpdated] = await trx('user-orga-settings')
    .where({ userId })
    .update({ currentOrganizationId: organizationId, updatedAt: new Date() })
    .returning('*');
  const user = await trx('users').where('id', userId).first();
  const currentOrganization = await trx('organizations')
    .where('id', userOrgaSettingsUpdated.currentOrganizationId)
    .first();
  return new UserOrgaSettings({
    id: userOrgaSettingsUpdated.id,
    createdAt: userOrgaSettingsUpdated.createdAt,
    updatedAt: userOrgaSettingsUpdated.updatedAt,
    user,
    currentOrganization,
  });
};

/**
 * @param {{userId: string, organizationId: string}} params
 * @return {Promise<UserOrgaSettings>}
 */
const createOrUpdate = async function ({ userId, organizationId }) {
  const trx = DomainTransaction.getConnection();

  const knexUserOrgaSetting = (
    await trx('user-orga-settings')
      .insert({ userId, currentOrganizationId: organizationId })
      .onConflict('userId')
      .merge()
      .returning('*')
  )[0];

  const user = await trx('users').where({ id: knexUserOrgaSetting.userId }).first();

  const organization = await trx('organizations').where({ id: knexUserOrgaSetting.currentOrganizationId }).first();

  return new UserOrgaSettings({
    id: knexUserOrgaSetting.id,
    user,
    currentOrganization: organization,
  });
};

export const userOrgaSettingsRepository = { create, createOrUpdate, findOneByUserId, update };
