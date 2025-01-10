import { config } from '../../../../src/shared/config.js';
import { DEFAULT_PASSWORD } from '../../../constants.js';

function _buildBlockedUser(databaseBuilder) {
  const blockedUser = databaseBuilder.factory.buildUser.withRawPassword({
    firstName: 'Goldi',
    lastName: 'Locks',
    email: 'blocked@example.net',
    username: 'goldi.locks',
    rawPassword: DEFAULT_PASSWORD,
    cgu: false,
  });

  databaseBuilder.factory.buildUserLogin({
    userId: blockedUser.id,
    failureCount: config.login.blockingLimitFailureCount,
    blockedAt: new Date(),
  });
}

function _buildAlmostBlockedUser(databaseBuilder) {
  const almostBlockedUser = databaseBuilder.factory.buildUser.withRawPassword({
    firstName: 'Silveri',
    lastName: 'Locks',
    email: 'almost-blocked@example.net',
    username: 'silveri.locks',
    rawPassword: DEFAULT_PASSWORD,
    cgu: false,
  });

  databaseBuilder.factory.buildUserLogin({
    userId: almostBlockedUser.id,
    failureCount: config.login.blockingLimitFailureCount - 1,
  });
}

function _buildAlmostTemporarilyBlockedUser(databaseBuilder) {
  const temporaryBlockedUser = databaseBuilder.factory.buildUser.withRawPassword({
    firstName: 'Little',
    lastName: 'Bear',
    email: 'temporarily-blocked@example.net',
    username: 'little.bear0101',
    rawPassword: DEFAULT_PASSWORD,
    cgu: false,
  });

  databaseBuilder.factory.buildUserLogin({
    userId: temporaryBlockedUser.id,
    failureCount: config.login.temporaryBlockingThresholdFailureCount - 1,
  });
}

export function buildBlockedUsers(databaseBuilder) {
  _buildBlockedUser(databaseBuilder);
  _buildAlmostBlockedUser(databaseBuilder);
  _buildAlmostTemporarilyBlockedUser(databaseBuilder);
}
