export async function findById({ userId, userApi }) {
  const users = await userApi.getActiveByUserIds({ userIds: [userId] });
  return users ? users[0] : null;
}
