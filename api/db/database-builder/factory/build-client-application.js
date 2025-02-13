import { databaseBuffer } from '../database-buffer.js';

export function buildClientApplication({
  id = databaseBuffer.getNextId(),
  name = 'clientApplication',
  clientId = 'client-id',
  clientSecret = 'super-secret',
  scopes = ['scope1', 'scope2'],
} = {}) {
  return databaseBuffer.pushInsertable({
    tableName: 'client_applications',
    values: {
      id,
      name,
      clientId,
      clientSecret,
      scopes,
    },
  });
}
