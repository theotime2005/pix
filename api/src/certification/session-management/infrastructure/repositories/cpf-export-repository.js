import { DomainTransaction } from '../../../../shared/domain/DomainTransaction.js';

const findFileNamesByStatus = async function ({ cpfImportStatus }) {
  const trx = DomainTransaction.getConnection();
  return trx('certification-courses-cpf-infos').where({ importStatus: cpfImportStatus }).pluck('filename').distinct();
};

export { findFileNamesByStatus };
