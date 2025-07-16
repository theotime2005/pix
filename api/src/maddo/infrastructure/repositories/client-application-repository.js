import { DomainTransaction } from '../../../shared/domain/DomainTransaction.js';

export async function getJurisdiction(clientId) {
  const trx = DomainTransaction.getConnection();

  const clientApplication = await trx('client_applications').select('jurisdiction').where({ clientId }).first();
  return clientApplication.jurisdiction;
}
