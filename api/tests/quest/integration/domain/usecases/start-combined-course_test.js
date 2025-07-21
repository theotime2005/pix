import { CombinedCourseParticipationStatuses } from '../../../../../src/prescription/shared/domain/constants.js';
import { usecases } from '../../../../../src/quest/domain/usecases/index.js';
import { databaseBuilder, domainBuilder, expect, knex } from '../../../../test-helper.js';

describe('Integration | Combined course | Domain | UseCases | start-combined-course', function () {
  describe('when combined-course participation does not exist', function () {
    it('should create combined-course participation', async function () {
      //given
      const organizationId = databaseBuilder.factory.buildOrganization().id;
      const organizationLearner = databaseBuilder.factory.buildOrganizationLearner({ organizationId });
      const questId = databaseBuilder.factory.buildQuest({ organizationId, code: 'COMBINIX8' }).id;
      await databaseBuilder.commit();

      //when
      await usecases.startCombinedCourse({
        userId: organizationLearner.userId,
        code: 'COMBINIX8',
      });

      //then
      const [participation] = await knex('quest_participations').where({
        questId,
        organizationLearnerId: organizationLearner.id,
      });
      expect(participation.id).to.be.finite;
      expect(participation.questId).to.deep.equal(questId);
      expect(participation.organizationLearnerId).to.deep.equal(organizationLearner.id);
      expect(participation.status).to.deep.equal(CombinedCourseParticipationStatuses.STARTED);
    });
    describe('when organization learner does not exist', function () {
      it('should also create organization learner', async function () {
        //given
        const user = databaseBuilder.factory.buildUser();
        const organizationId = databaseBuilder.factory.buildOrganization().id;
        const questId = databaseBuilder.factory.buildQuest({ organizationId, code: 'COMBINIX8' }).id;
        await databaseBuilder.commit();

        const organizationLearner = domainBuilder.buildOrganizationLearner({
          firstName: user.firstName,
          lastName: user.lastName,
        });

        //when
        await usecases.startCombinedCourse({
          userId: user.id,
          code: 'COMBINIX8',
        });

        //then
        const createdOrganizationLearner = await knex('organization-learners')
          .where({ firstName: organizationLearner.firstName, lastName: organizationLearner.lastName })
          .first();
        expect(createdOrganizationLearner).not.to.be.undefined;

        const [participation] = await knex('quest_participations').where({
          questId,
          organizationLearnerId: createdOrganizationLearner.id,
        });

        expect(participation.id).to.be.finite;
        expect(participation.questId).to.deep.equal(questId);
        expect(participation.organizationLearnerId).to.deep.equal(createdOrganizationLearner.id);
        expect(participation.status).to.deep.equal(CombinedCourseParticipationStatuses.STARTED);
      });
    });
  });
});
