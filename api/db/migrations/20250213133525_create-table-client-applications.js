import { config } from '../../src/shared/config.js';
import { cryptoService } from '../../src/shared/domain/services/crypto-service.js';

const TABLE_NAME = 'client_applications';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable(TABLE_NAME, function (table) {
    table.increments('id').primary().notNullable().comment('Identifiant d’une application tierce');
    table.string('name').notNullable().unique().comment('Nom de l’application tierce');
    table.string('clientId').notNullable().unique().comment('ID du client de l’application tierce');
    table.string('clientSecret').notNullable().comment('Secret du client de l’application tierce');
    table.specificType('scopes', 'varchar(255)[]').notNullable().comment('Scopes autorisés pour l’application');
    table.timestamps(false, true, true);
    table.comment('Applications tierces');
  });

  for (const applicationCredentials of config.apimRegisterApplicationsCredentials) {
    const encryptedClientSecret = await cryptoService.hashPassword(applicationCredentials.clientSecret);

    await knex
      .insert({
        name: applicationCredentials.source,
        clientId: applicationCredentials.clientId,
        clientSecret: encryptedClientSecret,
        scopes: [applicationCredentials.scope],
      })
      .into(TABLE_NAME);
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTable(TABLE_NAME);
}
