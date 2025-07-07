import { VerifiedCode } from '../../../../../src/quest/domain/models/VerifiedCode.js';
import * as verifiedCodeSerializer from '../../../../../src/quest/infrastructure/serializers/verified-code-serializer.js';
import { expect } from '../../../../test-helper.js';

describe.only('Quest | Unit | Infrastructure | Serializers | verified-code', function () {
  it('#serialize with campaign', function () {
    const verifiedCode = new VerifiedCode({
      code: 'ABCDEFGH',
      courseTypes: [{ type: 'campaign' }],
    });

    const serialized = verifiedCodeSerializer.serialize(verifiedCode);

    expect(serialized).to.deep.equal({
      data: {
        type: 'verified-codes',
        id: 'ABCDEFGH',
        attributes: {},
        relationships: {
          courseTypes: {
            data: [
              {
                type: 'campaign',
                id: 'ABCDEFGH',
              },
            ],
          },
        },
      },
    });
  });
});
