const TABLE_NAME = 'quest_participations';

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
const up = async function (knex) {
  await knex.schema.table(TABLE_NAME, function (table) {
    table.unique(['questId', 'organizationLearnerId']);
  });
};

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
const down = async function (knex) {
  await knex.schema.table(TABLE_NAME, function (table) {
    table.dropUnique(['questId', 'organizationLearnerId']);
  });
};

export { down, up };
