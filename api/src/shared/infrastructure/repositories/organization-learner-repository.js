import { knex } from '../../../../db/knex-database-connection.js';
import { OrganizationLearner } from '../../../prescription/learner-management/domain/models/OrganizationLearner.js';
import { ORGANIZATION_FEATURE } from '../../domain/constants.js';
import { DomainTransaction } from '../../domain/DomainTransaction.js';
import { OrganizationLearnerNotFound, UserNotFoundError } from '../../domain/errors.js';
import { ParticipantRepartition } from '../../domain/models/ParticipantRepartition.js';
import { fetchPage } from '../utils/knex-utils.js';

const findByIds = async function ({ ids }) {
  const rawOrganizationLearners = await knex
    .select('*')
    .from('view-active-organization-learners')
    .whereIn('id', ids)
    .orderBy('id');

  return rawOrganizationLearners.map((rawOrganizationLearner) => new OrganizationLearner(rawOrganizationLearner));
};

const findByOrganizationId = function ({ organizationId }) {
  const knexConn = DomainTransaction.getConnection();
  return knexConn('view-active-organization-learners')
    .where({ organizationId })
    .orderByRaw('LOWER("lastName") ASC, LOWER("firstName") ASC')
    .then((organizationLearners) =>
      organizationLearners.map((organizationLearner) => new OrganizationLearner(organizationLearner)),
    );
};

const findByOrganizationIdAndUpdatedAtOrderByDivision = async function ({ organizationId, page, filter }) {
  const BEGINNING_OF_THE_2020_SCHOOL_YEAR = '2020-08-15';
  const trx = DomainTransaction.getConnection();
  const query = trx('view-active-organization-learners')
    .where({
      organizationId,
      isDisabled: false,
    })
    .where('updatedAt', '>', BEGINNING_OF_THE_2020_SCHOOL_YEAR)
    .orderByRaw('LOWER("division") ASC, LOWER("lastName") ASC, LOWER("firstName") ASC');

  if (filter.divisions) {
    query.whereIn('division', filter.divisions);
  }

  const { results, pagination } = await fetchPage(query, page);

  return {
    data: results.map((result) => new OrganizationLearner(result)),
    pagination,
  };
};

const findByUserId = async function ({ userId }) {
  const knexConn = DomainTransaction.getConnection();
  const rawOrganizationLearners = await knexConn
    .select('*')
    .from('view-active-organization-learners')
    .where({ userId })
    .orderBy('id');

  return rawOrganizationLearners.map((rawOrganizationLearner) => new OrganizationLearner(rawOrganizationLearner));
};

const findByOrganizationIdAndBirthdate = async function ({ organizationId, birthdate }) {
  const rawOrganizationLearners = await knex
    .select('*')
    .from('view-active-organization-learners')
    .where({ organizationId, birthdate, isDisabled: false })
    .orderBy('id');

  return rawOrganizationLearners.map((rawOrganizationLearner) => new OrganizationLearner(rawOrganizationLearner));
};

const dissociateAllStudentsByUserId = async function ({ userId }) {
  const knexConn = DomainTransaction.getConnection();
  await _queryBuilderDissociation(knexConn)
    .where({ userId })
    .whereIn(
      'organization-learners.organizationId',
      knexConn.select('id').from('organizations').where({ isManagingStudents: true }),
    );
};

function _queryBuilderDissociation(knexConn) {
  return knexConn('organization-learners').update({
    userId: null,
    certifiableAt: null,
    isCertifiable: null,
    updatedAt: new Date(),
  });
}

const getLatestOrganizationLearner = async function ({ nationalStudentId, birthdate }) {
  const trx = DomainTransaction.getConnection();
  const organizationLearner = await trx
    .where({ nationalStudentId, birthdate })
    .whereNotNull('userId')
    .select()
    .from('view-active-organization-learners')
    .orderBy('updatedAt', 'desc')
    .first();

  if (!organizationLearner) {
    throw new UserNotFoundError();
  }

  return organizationLearner;
};

const updateUserIdWhereNull = async function ({ organizationLearnerId, userId }) {
  const knexConn = DomainTransaction.getConnection();
  const [rawOrganizationLearner] = await knexConn('organization-learners')
    .where({ id: organizationLearnerId, userId: null })
    .update({ userId, updatedAt: knex.fn.now() })
    .returning('*');

  if (!rawOrganizationLearner)
    throw new OrganizationLearnerNotFound(
      `OrganizationLearner not found for ID ${organizationLearnerId} and user ID null.`,
    );

  return new OrganizationLearner(rawOrganizationLearner);
};

const isActive = async function ({ userId, campaignId }) {
  const trx = DomainTransaction.getConnection();
  const learner = await trx('view-active-organization-learners')
    .select('view-active-organization-learners.isDisabled')
    .join('organizations', 'organizations.id', 'view-active-organization-learners.organizationId')
    .join('campaigns', 'campaigns.organizationId', 'organizations.id')
    .where({ 'campaigns.id': campaignId })
    .andWhere({ 'view-active-organization-learners.userId': userId })
    .first();
  return !learner?.isDisabled;
};

async function countByOrganizationsWhichNeedToComputeCertificability({
  skipActivityDate = false,
  onlyNotComputed = false,
  fromUserActivityDate,
  toUserActivityDate,
} = {}) {
  const queryBuilder = _queryBuilderForCertificability({
    fromUserActivityDate,
    toUserActivityDate,
    skipActivityDate,
    onlyNotComputed,
  });

  const [{ count }] = await queryBuilder.count('view-active-organization-learners.id');
  return count;
}

function findByOrganizationsWhichNeedToComputeCertificability({
  limit,
  offset,
  fromUserActivityDate,
  toUserActivityDate,
  skipActivityDate = false,
  onlyNotComputed = false,
} = {}) {
  const queryBuilder = _queryBuilderForCertificability({
    fromUserActivityDate,
    toUserActivityDate,
    skipActivityDate,
    onlyNotComputed,
  });

  return queryBuilder
    .orderBy('view-active-organization-learners.id', 'ASC')
    .modify(function (qB) {
      if (limit) {
        qB.limit(limit);
      }
      if (offset) {
        qB.offset(offset);
      }
    })
    .pluck('view-active-organization-learners.id');
}

function _queryBuilderForCertificability({
  fromUserActivityDate,
  toUserActivityDate,
  skipActivityDate,
  onlyNotComputed,
}) {
  const knexConn = DomainTransaction.getConnection();
  return knexConn('view-active-organization-learners')
    .join(
      'organization-features',
      'view-active-organization-learners.organizationId',
      '=',
      'organization-features.organizationId',
    )
    .join('features', 'organization-features.featureId', '=', 'features.id')
    .join('users', 'view-active-organization-learners.userId', '=', 'users.id')
    .where('features.key', '=', ORGANIZATION_FEATURE.COMPUTE_ORGANIZATION_LEARNER_CERTIFICABILITY.key)
    .where('view-active-organization-learners.isDisabled', false)
    .modify(function (queryBuilder) {
      if (!skipActivityDate) {
        queryBuilder.join('user-logins', function () {
          this.on('view-active-organization-learners.userId', 'user-logins.userId')
            .andOnVal('user-logins.lastLoggedAt', '>', fromUserActivityDate)
            .andOnVal('user-logins.lastLoggedAt', '<=', toUserActivityDate);
        });
      }
      if (onlyNotComputed) {
        queryBuilder.whereNull('view-active-organization-learners.isCertifiable');
      }
    });
}

/**
 * @function
 * @name findAllLearnerWithAtLeastOneParticipationByOrganizationId
 * @typedef {number} organizationId
 * @returns {Promise<ParticipantRepartition>}
 */
const findAllLearnerWithAtLeastOneParticipationByOrganizationId = async function (organizationId) {
  const knexConn = DomainTransaction.getConnection();
  const result = await knexConn
    .select('users.isAnonymous')
    .distinct('view-active-organization-learners.id')
    .from('view-active-organization-learners')
    .join('users', 'users.id', 'view-active-organization-learners.userId')
    .join('campaign-participations', function () {
      this.on('campaign-participations.organizationLearnerId', 'view-active-organization-learners.id').andOnVal(
        'campaign-participations.deletedAt',
        knex.raw('IS'),
        knex.raw('NULL'),
      );
    })
    .where({ organizationId });

  return new ParticipantRepartition(result);
};

const findAllLearnerWithAtLeastOneParticipationByOrganizationIds = async function (organizationIds) {
  const knexConn = DomainTransaction.getConnection();
  const results = await knexConn
    .select('users.isAnonymous', 'view-active-organization-learners.organizationId')
    .distinct('view-active-organization-learners.id')
    .from('view-active-organization-learners')
    .join('users', 'users.id', 'view-active-organization-learners.userId')
    .join('campaign-participations', function () {
      this.on('campaign-participations.organizationLearnerId', 'view-active-organization-learners.id').andOnVal(
        'campaign-participations.deletedAt',
        knex.raw('IS'),
        knex.raw('NULL'),
      );
    })
    .whereIn('organizationId', organizationIds);

  const resultByOrganization = {};

  organizationIds.forEach((organizationId) => {
    const participants = results.filter((result) => result.organizationId === organizationId);
    resultByOrganization[organizationId] = new ParticipantRepartition(participants);
  });

  return resultByOrganization;
};

export {
  countByOrganizationsWhichNeedToComputeCertificability,
  dissociateAllStudentsByUserId,
  findAllLearnerWithAtLeastOneParticipationByOrganizationId,
  findAllLearnerWithAtLeastOneParticipationByOrganizationIds,
  findByIds,
  findByOrganizationId,
  findByOrganizationIdAndBirthdate,
  findByOrganizationIdAndUpdatedAtOrderByDivision,
  findByOrganizationsWhichNeedToComputeCertificability,
  findByUserId,
  getLatestOrganizationLearner,
  isActive,
  updateUserIdWhereNull,
};
