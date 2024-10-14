export async function getAttestationDataForUsers({
  attestationKey,
  userIds,
  locale,
  userRepository,
  profileRewardRepository,
  attestationRepository,
}) {
  const users = await userRepository.getByIds({ userIds });
  const profileRewards = await profileRewardRepository.getByAttestationKeyAndUserIds({ attestationKey, userIds });
  const { templateName } = await attestationRepository.getByKey({ attestationKey });

  return {
    data: profileRewards.map(({ userId, createdAt }) => {
      const user = users.find((user) => user.id === userId);
      return user.toForm(createdAt, locale);
    }),
    templateName,
  };
}
