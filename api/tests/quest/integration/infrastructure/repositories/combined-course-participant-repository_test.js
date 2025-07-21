import * as combinedCourseParticipantRepository from '../../../../../src/quest/infrastructure/repositories/combined-course-participant-repository.js';
import { databaseBuilder, expect, knex } from '../../../../test-helper.js';

describe('Quest | Integration | Infrastructure | repositories | Combined Course Participant', function () {
  describe('#getOrCreate', function () {
    it('should get organization learner id if she exists', async function () {
      const organizationId = databaseBuilder.factory.buildOrganization().id;

      const organizationLearner = databaseBuilder.factory.buildOrganizationLearner({
        organizationId,
      });

      await databaseBuilder.commit();

      const result = await combinedCourseParticipantRepository.getOrCreateNewOrganizationLearner({
        organizationLearner,
        userId: organizationLearner.userId,
        organizationId,
      });
      expect(result).to.be.equal(organizationLearner.id);
    });
    it('should create a new organization learner if organization learner does not exist', async function () {
      const organizationLearner = { firstName: 'Sophie', lastName: 'Fonfek' };
      const userId = databaseBuilder.factory.buildUser({
        firstName: organizationLearner.firstName,
        lastName: organizationLearner.lastName,
      }).id;
      const organizationId = databaseBuilder.factory.buildOrganization().id;
      await databaseBuilder.commit();

      await combinedCourseParticipantRepository.getOrCreateNewOrganizationLearner({
        organizationLearner,
        userId,
        organizationId,
      });

      //then
      const learners = await knex('organization-learners').where({ organizationId });
      expect(learners).to.have.lengthOf(1);
      expect(learners[0].firstName).to.equal('Sophie');
      expect(learners[0].lastName).to.equal('Fonfek');
    });
  });
});
