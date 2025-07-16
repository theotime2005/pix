import { knex } from '../../../../../db/knex-database-connection.js';
import { DomainTransaction } from '../../../../shared/domain/DomainTransaction.js';
import { UserNotFoundError } from '../../../../shared/domain/errors.js';
import { CertificationOfficer } from '../../domain/models/CertificationOfficer.js';

const get = async function ({ userId }) {
  const trx = DomainTransaction.getConnection();

  const certificationOfficer = await trx('users').select(['id', 'firstName', 'lastName']).where({ id: userId }).first();

  if (!certificationOfficer) {
    throw new UserNotFoundError(`User not found for ID ${userId}`);
  }
  return _toDomain(certificationOfficer);
};

export { get };

function _toDomain(certificationOfficer) {
  return new CertificationOfficer(certificationOfficer);
}
