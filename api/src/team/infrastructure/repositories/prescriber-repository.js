import { Organization } from '../../../organizational-entities/domain/models/Organization.js';
import { Tag } from '../../../organizational-entities/domain/models/Tag.js';
import { config } from '../../../shared/config.js';
import { DomainTransaction } from '../../../shared/domain/DomainTransaction.js';
import { ForbiddenAccess, UserNotFoundError } from '../../../shared/domain/errors.js';
import { Membership } from '../../../shared/domain/models/index.js';
import { UserOrgaSettings } from '../../../shared/domain/models/UserOrgaSettings.js';
import { Prescriber } from '../../domain/read-models/Prescriber.js';

/**
 * @param {Object} params
 * @property {string} params.userId
 * @param {any} params.legalDocumentApi
 * @return {Promise<Prescriber>}
 */
const getPrescriber = async function ({ userId, legalDocumentApi }) {
  const trx = DomainTransaction.getConnection();
  const user = await trx('users').select('id', 'firstName', 'lastName', 'lang').where({ id: userId }).first();

  if (!user) {
    throw new UserNotFoundError(`User not found for ID ${userId}`);
  }

  const pixOrgaLegalDocumentStatus = await legalDocumentApi.getLegalDocumentStatusByUserId({
    userId,
    service: 'pix-orga',
    type: 'TOS',
  });

  const memberships = await trx('memberships').where({ userId, disabledAt: null }).orderBy('id');

  if (memberships.length === 0) {
    throw new ForbiddenAccess(`User of ID ${userId} is not a prescriber`);
  }

  const organizationIds = memberships.map((membership) => membership.organizationId);
  const organizations = await trx('organizations').whereIn('id', organizationIds);
  const userOrgaSettings = await trx('user-orga-settings').where({ userId }).first();
  const tags = await trx('tags')
    .join('organization-tags', 'organization-tags.tagId', 'tags.id')
    .where({ organizationId: userOrgaSettings.currentOrganizationId });

  const schools = await trx('schools').whereIn('organizationId', organizationIds);

  const prescriber = _toPrescriberDomain({
    user,
    pixOrgaLegalDocumentStatus,
    userOrgaSettings,
    tags,
    memberships,
    organizations,
    schools,
  });

  const currentOrganizationId = prescriber.userOrgaSettings.currentOrganization.id;
  prescriber.areNewYearOrganizationLearnersImported =
    await _areNewYearOrganizationLearnersImportedForPrescriber(currentOrganizationId);
  prescriber.participantCount = await _getParticipantCount(currentOrganizationId);
  prescriber.features = await _organizationFeatures(currentOrganizationId);

  return prescriber;
};

export const prescriberRepository = { getPrescriber };

function _toPrescriberDomain({
  user,
  pixOrgaLegalDocumentStatus,
  userOrgaSettings,
  tags,
  memberships,
  organizations,
  schools,
}) {
  const currentSchool = schools.find((school) => school.organizationId === userOrgaSettings.currentOrganizationId);

  return new Prescriber({
    ...user,
    pixOrgaTermsOfServiceStatus: pixOrgaLegalDocumentStatus.status,
    pixOrgaTermsOfServiceDocumentPath: pixOrgaLegalDocumentStatus.documentPath,

    memberships: memberships.map(
      (membership) =>
        new Membership({
          ...membership,
          organization: new Organization({
            ...organizations.find((organization) => organization.id === membership.organizationId),
            schoolCode: schools.find((school) => school.organizationId === membership.organizationId)?.code,
          }),
        }),
    ),
    userOrgaSettings: new UserOrgaSettings({
      id: userOrgaSettings.id,
      currentOrganization: new Organization({
        ...organizations.find((organization) => organization.id === userOrgaSettings.currentOrganizationId),
        schoolCode: currentSchool?.code,
        sessionExpirationDate: currentSchool?.sessionExpirationDate,
        tags: tags.map((tag) => new Tag(tag)),
      }),
    }),
  });
}

async function _areNewYearOrganizationLearnersImportedForPrescriber(currentOrganizationId) {
  const trx = DomainTransaction.getConnection();

  const atLeastOneOrganizationLearner = await trx('organizations')
    .select('organizations.id')
    .join('view-active-organization-learners', 'view-active-organization-learners.organizationId', 'organizations.id')
    .where((qb) => {
      qb.where('organizations.id', currentOrganizationId);
      if (config.features.newYearOrganizationLearnersImportDate) {
        qb.where(
          'view-active-organization-learners.createdAt',
          '>=',
          config.features.newYearOrganizationLearnersImportDate,
        );
      }
    })
    .first();

  return Boolean(atLeastOneOrganizationLearner);
}

async function _getParticipantCount(currentOrganizationId) {
  const trx = DomainTransaction.getConnection();

  const { count: allCounts } = await trx('view-active-organization-learners')
    .count('view-active-organization-learners.id')
    .leftJoin('users', 'users.id', 'view-active-organization-learners.userId')
    .where('isAnonymous', false)
    .where('organizationId', currentOrganizationId)
    .where('isDisabled', false)
    .first();

  return allCounts;
}

async function _organizationFeatures(currentOrganizationId) {
  const availableFeatures = await _availableFeaturesQueryBuilder(currentOrganizationId);
  const allFeatures = await _allFeatures();

  const organizationFeatures = allFeatures.reduce((accumulator, feature) => {
    const availableFeature = availableFeatures.find(({ key }) => key === feature);
    if (!availableFeature) return { ...accumulator, [feature]: { active: false, params: null } };
    return { ...accumulator, [feature]: { active: true, params: availableFeature.params } };
  }, {});

  return organizationFeatures;
}

function _allFeatures() {
  const trx = DomainTransaction.getConnection();

  return trx('features').select('key').pluck('key');
}

function _availableFeaturesQueryBuilder(currentOrganizationId) {
  const trx = DomainTransaction.getConnection();

  return trx('features')
    .select('key', 'organization-features.params')
    .join('organization-features', function () {
      this.on('features.id', 'organization-features.featureId').andOn(
        'organization-features.organizationId',
        currentOrganizationId,
      );
    });
}
