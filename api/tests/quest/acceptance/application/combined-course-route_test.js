import { CombinedCourseParticipationStatuses } from '../../../../src/prescription/shared/domain/constants.js';
import {
  createServer,
  databaseBuilder,
  expect,
  generateAuthenticatedUserRequestHeaders,
} from '../../../test-helper.js';

describe('Quest | Acceptance | Application | Combined course Route ', function () {
  let server;

  beforeEach(async function () {
    server = await createServer();
  });

  describe('GET /api/combined-courses', function () {
    it('should return the combined course requested by code', async function () {
      // given
      const organizationId = databaseBuilder.factory.buildOrganization({ type: 'SCO' }).id;

      const { userId } = databaseBuilder.factory.buildOrganizationLearner({
        organizationId,
      });

      const quest = databaseBuilder.factory.buildQuest({ code: 'SOMETHING', name: 'Mon parcours' });

      await databaseBuilder.commit();

      const options = {
        method: 'GET',
        url: `/api/combined-courses/?filter[code]=${quest.code}`,
        headers: generateAuthenticatedUserRequestHeaders({ userId }),
      };

      // when
      const response = await server.inject(options);

      // then
      expect(response.statusCode).to.equal(200);
      expect(Number(response.result.data.id)).to.equal(quest.id);
      expect(response.result.data.attributes.name).to.equal('Mon parcours');
    });

    it('should return 404 when combined course with this code does not exist', async function () {
      // given
      const organizationId = databaseBuilder.factory.buildOrganization({ type: 'SCO' }).id;

      const { userId } = databaseBuilder.factory.buildOrganizationLearner({
        organizationId,
      });

      const options = {
        method: 'GET',
        url: `/api/combined-courses/?filter[code]=NOTHINGTT`,
        headers: generateAuthenticatedUserRequestHeaders({ userId }),
      };

      // when
      const response = await server.inject(options);

      // then
      expect(response.statusCode).to.equal(404);
    });
  });

  describe('PUT /api/combined-course/{code}/start', function () {
    it('should create a participation', async function () {
      // given
      const userId = databaseBuilder.factory.buildUser().id;
      const organizationId = databaseBuilder.factory.buildOrganization().id;
      databaseBuilder.factory.buildQuest({ name: 'MA QUETE', organizationId, code: 'COMBINIX2' });

      await databaseBuilder.commit();
      const options = {
        method: 'PUT',
        url: '/api/combined-courses/COMBINIX2/start',
        headers: generateAuthenticatedUserRequestHeaders({ userId }),
      };

      // when
      const response = await server.inject(options);

      // then
      expect(response.statusCode).to.equal(204);
    });

    it('should return 204 answer even if participation already exists', async function () {
      // given
      const userId = databaseBuilder.factory.buildUser().id;
      const organizationId = databaseBuilder.factory.buildOrganization().id;
      const questId = databaseBuilder.factory.buildQuest({ name: 'MA QUETE', organizationId, code: 'COMBINIX2' }).id;
      const organizationLearner = databaseBuilder.factory.buildOrganizationLearner({ userId, organizationId });
      databaseBuilder.factory.buildCombinedCourseParticipation({
        questId,
        organizationLearnerId: organizationLearner.id,
        status: CombinedCourseParticipationStatuses.COMPLETED,
      });
      await databaseBuilder.commit();
      const options = {
        method: 'PUT',
        url: '/api/combined-courses/COMBINIX2/start',
        headers: generateAuthenticatedUserRequestHeaders({ userId }),
      };

      // when
      const response = await server.inject(options);

      // then
      expect(response.statusCode).to.equal(204);
    });
  });
});
