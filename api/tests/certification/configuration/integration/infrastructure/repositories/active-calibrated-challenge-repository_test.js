import * as activeCalibratedChallengeRepository from '../../../../../../src/certification/configuration/infrastructure/repositories/active-calibrated-challenge-repository.js';
import { ComplementaryCertificationKeys } from '../../../../../../src/certification/shared/domain/models/ComplementaryCertificationKeys.js';
import { datamartBuilder, domainBuilder, expect } from '../../../../../test-helper.js';

describe('Certification | Configuration | Integration | Repository | active-calibrated-challenge', function () {
  describe('#findByComplementaryKeyAndChallengeIds', function () {
    it('should return empty array when empty challenges given', async function () {
      const challenges = [];
      const complementaryCertificationKey = ComplementaryCertificationKeys.PIX_PLUS_DROIT;

      const calibratedChallenges = activeCalibratedChallengeRepository.findByComplementaryKeyAndChallengeIds({
        complementaryCertificationKey,
        challenges,
      });
      expect(calibratedChallenges).to.be.empty;
    });

    it('should return active calibrated challenges sorted by challengeId', async function () {
      //given
      const complementaryCertificationKey = ComplementaryCertificationKeys.PIX_PLUS_DROIT;
      const otherChallengeId = 'rec5678';

      const secondActiveCalibratedChallenge = datamartBuilder.factory.buildActiveCalibratedChallenge({
        challengeId: 'rec4567',
        calibrationId: '12',
        scope: complementaryCertificationKey,
      });
      const firstActiveCalibratedChallenge = datamartBuilder.factory.buildActiveCalibratedChallenge({
        challengeId: 'rec1234',
        calibrationId: '12',
        scope: complementaryCertificationKey,
      });
      // from CLEA scope
      datamartBuilder.factory.buildActiveCalibratedChallenge({
        challengeId: 'rec1234',
        scope: ComplementaryCertificationKeys.CLEA,
      });
      // with other challenges
      datamartBuilder.factory.buildActiveCalibratedChallenge({
        otherChallengeId,
        scope: complementaryCertificationKey,
      });
      const expectedActiveCalibratedChallenges = [
        domainBuilder.certification.configuration.buildActiveCalibratedChallenge({
          ...firstActiveCalibratedChallenge,
          challengeId: firstActiveCalibratedChallenge.challenge_id,
        }),
        domainBuilder.certification.configuration.buildActiveCalibratedChallenge({
          ...secondActiveCalibratedChallenge,
          challengeId: secondActiveCalibratedChallenge.challenge_id,
        }),
      ];

      const challengeIds = ['rec4567', 'rec1234'];
      await datamartBuilder.commit();

      //when
      const calibratedChallenges = await activeCalibratedChallengeRepository.findByComplementaryKeyAndChallengeIds({
        complementaryCertificationKey,
        challengeIds,
      });

      //then
      expect(calibratedChallenges).to.deep.equal(expectedActiveCalibratedChallenges);
    });
  });
});
