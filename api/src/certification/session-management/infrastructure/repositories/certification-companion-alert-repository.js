import { DomainTransaction } from '../../../../shared/domain/DomainTransaction.js';
const TABLE_NAME = 'certification-companion-live-alerts';

export async function create({ assessmentId, knex = DomainTransaction.getConnection() }) {
  const { count } = await knex.count().from(TABLE_NAME).where({ assessmentId, status: 'ONGOING' }).first();
  if (count > 0) return;
  await knex(TABLE_NAME).insert({ assessmentId });
}
