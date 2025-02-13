import { knex } from '../../../../db/knex-database-connection.js';
import { ClientApplication } from '../../domain/models/ClientApplication.js';

const TABLE_NAME = 'client_applications';

export const clientApplicationRepository = {
  async findByClientId(clientId) {
    const dto = await knex.select().from(TABLE_NAME).where({ clientId }).first();
    if (!dto) return undefined;
    return toDomain(dto);
  },
};

function toDomain(dto) {
  return new ClientApplication(dto);
}
