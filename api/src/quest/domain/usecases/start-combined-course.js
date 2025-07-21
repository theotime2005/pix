export async function startCombinedCourse({
  userId,
  code,
  combinedCourseParticipantRepository,
  combinedCourseRepository,
  questRepository,
  userRepository,
}) {
  const quest = await questRepository.getByCode({ code });
  const user = await userRepository.findById({ userId });

  const organizationLearnerId = await combinedCourseParticipantRepository.getOrCreateNewOrganizationLearner({
    userId,
    organizationId: quest.organizationId,
    organizationLearner: { firstName: user.firstName, lastName: user.lastName },
  });

  await combinedCourseRepository.save({ organizationLearnerId, questId: quest.id });
}
