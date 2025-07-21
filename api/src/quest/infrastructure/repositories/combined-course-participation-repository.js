import { DomainTransaction } from '../../../shared/domain/DomainTransaction.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import { CombinedCourseParticipation } from '../../domain/models/CombinedCourseParticipation.js';

export const save = async function ({ organizationLearnerId, questId }) {
  const knexConnection = DomainTransaction.getConnection();
  await knexConnection('quest_participations')
    .insert({
      questId,
      organizationLearnerId,
    })
    .onConflict(['questId', 'organizationLearnerId'])
    .ignore();
};

export const get = async function ({ organizationLearnerId, questId }) {
  const knexConnection = DomainTransaction.getConnection();

  const questParticipations = await knexConnection('quest_participations')
    .select('id', 'questId', 'organizationLearnerId', 'status')
    .where({
      organizationLearnerId,
      questId,
    });
  if (questParticipations.length === 0) {
    throw new NotFoundError(
      `CombinedCourseParticipation introuvable pour le couple organizationLearnerId=${organizationLearnerId}, questId=${questId}`,
    );
  }

  return new CombinedCourseParticipation(questParticipations[0]);
};
