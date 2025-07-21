import { REWARD_TYPES } from '../../../../../src/quest/domain/constants.js';
import { CombinedCourse } from '../../../../../src/quest/domain/models/CombinedCourse.js';
import { Quest } from '../../../../../src/quest/domain/models/Quest.js';
import * as questRepository from '../../../../../src/quest/infrastructure/repositories/quest-repository.js';
import { NotFoundError } from '../../../../../src/shared/domain/errors.js';
import { catchErr, databaseBuilder, expect, knex, sinon } from '../../../../test-helper.js';

describe('Quest | Integration | Repository | quest', function () {
  describe('#saveInBatch', function () {
    it('should save quests', async function () {
      const { id: rewardId } = databaseBuilder.factory.buildAttestation();
      const questInDatabase = databaseBuilder.factory.buildQuest({
        createdAt: new Date('2020-01-01T00:00:00Z'),
        updatedAt: new Date('2020-01-01T00:00:00Z'),
        rewardId,
        successRequirements: [],
      });
      databaseBuilder.factory.buildQuest({
        createdAt: new Date('2021-02-02T00:00:00Z'),
        updatedAt: new Date('2021-02-02T00:00:00Z'),
        rewardId,
      });
      await databaseBuilder.commit();
      await databaseBuilder.fixSequences();

      const expectedNewQuest = new Quest({
        id: undefined,
        rewardType: 'attestations',
        rewardId,
        eligibilityRequirements: [],
        successRequirements: [],
      });

      // when
      await questRepository.saveInBatch({
        quests: [expectedNewQuest, new Quest(questInDatabase)],
      });

      // then
      const [firstQuest, secondQuest, thirdQuest] = await knex('quests').orderBy('id');
      expect(firstQuest.updatedAt).to.not.deep.equal(new Date('2020-01-01T00:00:00Z'));
      expect(secondQuest.updatedAt).to.deep.equal(new Date('2021-02-02T00:00:00Z'));
      sinon.assert.match(
        new Quest(thirdQuest),
        sinon.match(
          new Quest({
            ...expectedNewQuest,
            eligibilityRequirements: expectedNewQuest.eligibilityRequirements,
            successRequirements: expectedNewQuest.successRequirements,
            organizationId: null,
            code: null,
            id: sinon.match.number,
            createdAt: sinon.match.date,
            updatedAt: sinon.match.date,
          }),
        ),
      );
    });
  });

  describe('#findAll', function () {
    it('should return all quests', async function () {
      // given
      databaseBuilder.factory.buildQuest({
        id: 1,
        rewardType: REWARD_TYPES.ATTESTATION,
        rewardId: 2,
        eligibilityRequirements: [],
        successRequirements: [],
      });
      databaseBuilder.factory.buildQuest({
        id: 2,
        rewardType: REWARD_TYPES.ATTESTATION,
        rewardId: 2,
        eligibilityRequirements: [],
        successRequirements: [],
      });
      databaseBuilder.factory.buildQuest({
        id: 3,
        rewardType: REWARD_TYPES.ATTESTATION,
        rewardId: 2,
        eligibilityRequirements: [],
        successRequirements: [],
      });
      await databaseBuilder.commit();

      // when
      const quests = await questRepository.findAll();

      // then
      expect(quests[0]).to.be.an.instanceof(Quest);
      expect(quests).to.have.lengthOf(3);
    });
  });

  describe('#findById', function () {
    it('should return a quest if quest exist', async function () {
      // given
      const questId = 1;
      databaseBuilder.factory.buildQuest({ id: questId });
      await databaseBuilder.commit();

      // when
      const quest = await questRepository.findById({ questId });

      // then
      expect(quest).to.be.an.instanceof(Quest);
      expect(quest.id).to.equal(1);
    });

    it('should return null if quest does not exist', async function () {
      // given
      const questId = 1;

      // when
      const quest = await questRepository.findById({ questId });

      // then
      expect(quest).to.be.null;
    });
  });

  describe('#getByCode', function () {
    it('should return a combined course if code exists', async function () {
      // given
      const code = 'SOMETHING';
      const { id: organizationId } = databaseBuilder.factory.buildOrganization();
      const questId = databaseBuilder.factory.buildQuest({ code, organizationId }).id;
      await databaseBuilder.commit();

      // when
      const quest = await questRepository.getByCode({ code });

      // then
      expect(quest).to.be.an.instanceof(CombinedCourse);
      expect(quest).to.deep.equal(new CombinedCourse({ ...quest, id: questId }));
    });

    it('should throw NotFoundError if quest does not exist', async function () {
      // given
      const code = 'NOTHINGTT';

      // when
      const error = await catchErr(questRepository.getByCode)({ code });

      // then
      expect(error).to.be.instanceOf(NotFoundError);
    });
  });

  describe('#deleteByIds', function () {
    it('should delete quest given ids', async function () {
      // given
      databaseBuilder.factory.buildQuest({
        id: 1,
        rewardType: REWARD_TYPES.ATTESTATION,
        rewardId: 2,
        eligibilityRequirements: [],
        successRequirements: [],
      });
      databaseBuilder.factory.buildQuest({
        id: 2,
        rewardType: REWARD_TYPES.ATTESTATION,
        rewardId: 2,
        eligibilityRequirements: [],
        successRequirements: [],
      });
      databaseBuilder.factory.buildQuest({
        id: 3,
        rewardType: REWARD_TYPES.ATTESTATION,
        rewardId: 2,
        eligibilityRequirements: [],
        successRequirements: [],
      });
      await databaseBuilder.commit();
      await databaseBuilder.fixSequences();

      // when
      await questRepository.deleteByIds({ questIds: ['1', 3] });

      const quests = await questRepository.findAll();

      // then
      expect(quests).to.have.lengthOf(1);
      expect(quests[0].id).to.equal(2);
    });
  });
});
