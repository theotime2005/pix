import { ChallengesReferential } from '../../../../../../src/certification/shared/domain/models/ChallengesReferential.js';
import { expect } from '../../../../../test-helper.js';

describe('Unit | Certification | Shared | Domain | Models | ChallengesReferential', function () {
  it('should return the center types', function () {
    // given / when / then
    expect(ChallengesReferential).to.contains({
      EXTERNAL: 'EXTERNAL',
      PIX: 'PIX',
    });
  });
});
