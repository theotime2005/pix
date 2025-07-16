import { DomainTransaction } from '../../../shared/domain/DomainTransaction.js';
import { Division } from '../../domain/models/Division.js';
import { School } from '../../domain/models/School.js';
import { SchoolNotFoundError } from '../../domain/school-errors.js';

const save = async function ({ organizationId, code }) {
  const knexConn = DomainTransaction.getConnection();
  await knexConn('schools').insert({ organizationId, code }).returning('*');
};

const isCodeAvailable = async function ({ code }) {
  const trx = DomainTransaction.getConnection();
  return !(await trx('schools').first('id').where({ code }));
};

const getByCode = async function ({ code }) {
  const trx = DomainTransaction.getConnection();
  const data = await trx('schools')
    .select('organizations.id', 'name', 'code')
    .join('organizations', 'organizations.id', 'organizationId')
    .where({ code })
    .first();

  if (!data) {
    throw new SchoolNotFoundError(`No school found for code ${code}`);
  }

  return new School(data);
};

const getById = async function ({ organizationId }) {
  const trx = DomainTransaction.getConnection();
  const result = await trx('schools').first('code').where({ organizationId });
  return result.code;
};

const updateSessionExpirationDate = async function ({ organizationId, sessionExpirationDate }) {
  const trx = DomainTransaction.getConnection();
  await trx('schools').where({ organizationId }).update({ sessionExpirationDate });
};

const getDivisions = async function ({ organizationId, organizationLearnerApi }) {
  const { organizationLearners } = await organizationLearnerApi.find({
    organizationId,
  });
  const divisionLearners = organizationLearners.map((organizationLearner) => organizationLearner.division);
  return [...new Set(divisionLearners)].sort().map((divisionName) => new Division({ name: divisionName }));
};

const getSessionExpirationDate = async function ({ code }) {
  const trx = DomainTransaction.getConnection();
  const [sessionExpirationDate] = await trx('schools')
    .select('sessionExpirationDate')
    .where({ code })
    .pluck('sessionExpirationDate');
  return sessionExpirationDate;
};

export {
  getByCode,
  getById,
  getDivisions,
  getSessionExpirationDate,
  isCodeAvailable,
  save,
  updateSessionExpirationDate,
};
