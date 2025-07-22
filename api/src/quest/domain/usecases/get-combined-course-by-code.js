import { CombinedCourse } from '../models/CombinedCourse.js';

export async function getCombinedCourseByCode({
  userId,
  code,
  combinedCourseParticipationRepository,
  combinedCourseParticipantRepository,
  questRepository,
}) {
  const quest = await questRepository.getByCode({ code });
  const organizationLearnerId = await combinedCourseParticipantRepository.getOrCreateNewOrganizationLearner({
    userId,
    organizationId: quest.organizationId,
  });
  const participation = await combinedCourseParticipationRepository.get({
    organizationLearnerId,
    questId: quest.id,
  });
  return new CombinedCourse(quest, participation);
}
