import { config } from '../../../../src/shared/config.js';
import { DEFAULT_PASSWORD } from '../../../constants.js';

function _buildAlmostTemporarilyBlockedUser(databaseBuilder) {
  const temporaryBlockedUser = databaseBuilder.factory.buildUser.withRawPassword({
    firstName: 'Little',
    lastName: 'Bear',
    email: 'temporary-blocked@example.net',
    username: 'little.bear0101',
    rawPassword: DEFAULT_PASSWORD,
    cgu: false,
  });

  databaseBuilder.factory.buildUserLogin({
    userId: temporaryBlockedUser.id,
    failureCount: config.login.temporaryBlockingThresholdFailureCount - 1,
  });
}

export function buildTemporaryBlockedUsers(databaseBuilder) {
  _buildAlmostTemporarilyBlockedUser(databaseBuilder);
}
