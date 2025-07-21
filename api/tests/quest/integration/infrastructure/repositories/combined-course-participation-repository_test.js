import { CombinedCourseParticipationStatuses } from '../../../../../src/prescription/shared/domain/constants.js';
import * as combinedCourseRepository from '../../../../../src/quest/infrastructure/repositories/combined-course-participation-repository.js';
import { NotFoundError } from '../../../../../src/shared/domain/errors.js';
import { catchErr, databaseBuilder, expect, knex } from '../../../../test-helper.js';

describe('Quest | Integration | Infrastructure | repositories | Combined-Course-Participation', function () {
  describe('#save', function () {
    it('should insert combined course participation', async function () {
      //given
      const organizationLearnerId = databaseBuilder.factory.buildOrganizationLearner().id;
      const questId = databaseBuilder.factory.buildQuest().id;
      await databaseBuilder.commit();

      //when
      await combinedCourseRepository.save({
        organizationLearnerId,
        questId,
      });

      //then
      const [participation] = await knex('quest_participations').where({
        organizationLearnerId,
        questId,
      });
      expect(participation.id).to.be.finite;
      expect(participation.questId).to.deep.equal(questId);
      expect(participation.organizationLearnerId).to.deep.equal(organizationLearnerId);
      expect(participation.status).to.deep.equal(CombinedCourseParticipationStatuses.STARTED);
    });

    it('should left intact combined course participation for given organization learner and quest ids', async function () {
      // given
      const organizationLearnerId = databaseBuilder.factory.buildOrganizationLearner().id;
      const questId = databaseBuilder.factory.buildQuest().id;
      databaseBuilder.factory.buildCombinedCourseParticipation({
        organizationLearnerId,
        questId,
        status: CombinedCourseParticipationStatuses.COMPLETED,
      });
      await databaseBuilder.commit();

      // when
      await combinedCourseRepository.save({ organizationLearnerId, questId });

      // then
      const [participation] = await knex('quest_participations').where({
        organizationLearnerId,
        questId,
      });
      expect(participation.id).to.be.finite;
      expect(participation.questId).to.deep.equal(questId);
      expect(participation.organizationLearnerId).to.deep.equal(organizationLearnerId);
      expect(participation.status).to.deep.equal(CombinedCourseParticipationStatuses.COMPLETED);
    });
  });
  describe('#get', function () {
    it('should return quest participation for given organization learner and quest ids', async function () {
      // given
      const organizationLearnerId = databaseBuilder.factory.buildOrganizationLearner().id;
      const questId = databaseBuilder.factory.buildQuest().id;
      databaseBuilder.factory.buildCombinedCourseParticipation({ organizationLearnerId, questId });
      await databaseBuilder.commit();

      // when
      const result = await combinedCourseRepository.get({ organizationLearnerId, questId });

      // then
      const participations = await knex('quest_participations').where({
        organizationLearnerId,
        questId,
      });
      expect(participations).to.have.lengthOf(1);
      expect(result.id).to.be.finite;
      expect(result.questId).to.deep.equal(questId);
      expect(result.organizationLearnerId).to.deep.equal(organizationLearnerId);
      expect(result.status).to.deep.equal(result.status);
    });
  });
  it('should throw NotFound error when quest participation does not exist for given organization learner and quest ids', async function () {
    // given
    const organizationLearnerId = 1;
    const questId = 2;

    // when
    const error = await catchErr(combinedCourseRepository.get)({ organizationLearnerId, questId });

    // then
    expect(error).to.be.instanceof(NotFoundError);
    expect(error.message).to.equal(
      `CombinedCourseParticipation introuvable pour le couple organizationLearnerId=${organizationLearnerId}, questId=${questId}`,
    );
  });
});
