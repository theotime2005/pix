import { knex } from '../../../../../datamart/knex-database-connection.js';
import { DomainTransaction } from '../../../../shared/domain/DomainTransaction.js';

async function findByTubes({ organizationId }) {
  const trx = DomainTransaction.getConnection();
  return trx('organizations_cover_rates')
    .select(
      'extraction_date',
      'domain_name as domaine',
      'competence_code',
      'competence_name as competence',
      'tube_practical_title as sujet',
      knex.raw('sum(sum_user_max_level) / sum(nb_user) as niveau_par_user'),
      knex.raw('sum(max_level * nb_user) / sum(nb_user) as niveau_par_sujet'),
      knex.raw('(sum(sum_user_max_level) / sum(nb_user)) / (sum(max_level * nb_user) / sum(nb_user)) as couverture'),
    )
    .where('orga_id', organizationId)
    .groupBy('extraction_date', 'domain_name', 'competence_code', 'competence_name', 'tube_id', 'tube_practical_title')
    .orderBy('niveau_par_sujet', 'desc')
    .orderBy('couverture', 'desc');
}

export { findByTubes };
