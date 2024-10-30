import { ORGANIZATION_FEATURE } from '../../../../../src/shared/domain/constants.js';
import { Membership } from '../../../../../src/shared/domain/models/index.js';
import {
  createServer,
  databaseBuilder,
  expect,
  generateValidRequestAuthorizationHeader,
} from '../../../../test-helper.js';

describe('Acceptance | Organization learner features', function () {
  describe('POST /api/organizations/{organizationId}/organization-learners/{organizationLearnerId}/features/{featureKey}', function () {
    it('should return 201 HTTP status code and add feature to organization learner', async function () {
      const organization = databaseBuilder.factory.buildOrganization();
      const organizationLearner = databaseBuilder.factory.buildOrganizationLearner({ organizationId: organization.id });
      const feature = databaseBuilder.factory.buildFeature({
        key: ORGANIZATION_FEATURE.ORALIZATION_MANAGED_BY_PRESCRIBER.key,
      });
      databaseBuilder.factory.buildOrganizationFeature({
        organizationId: organization.id,
        featureId: feature.id,
      });

      const notAdminUserId = databaseBuilder.factory.buildUser().id;
      databaseBuilder.factory.buildMembership({
        organizationId: organization.id,
        userId: notAdminUserId,
        organizationRole: Membership.roles.MEMBER,
      });

      await databaseBuilder.commit();
      const server = await createServer();

      const options = {
        method: 'POST',
        url: `/api/organizations/${organization.id}/organization-learners/${organizationLearner.id}/features/${feature.key}`,
        headers: {
          authorization: generateValidRequestAuthorizationHeader(notAdminUserId),
        },
      };

      const response = await server.inject(options);

      expect(response.statusCode).to.equal(201);
    });

    it("should return 403 HTTP status code if user don't have acces", async function () {
      // given
      const organization = databaseBuilder.factory.buildOrganization();
      const organizationLearner = databaseBuilder.factory.buildOrganizationLearner({ organizationId: organization.id });
      const otherOrganization = databaseBuilder.factory.buildOrganization();
      const feature = databaseBuilder.factory.buildFeature({
        key: ORGANIZATION_FEATURE.ORALIZATION_MANAGED_BY_PRESCRIBER.key,
      });
      databaseBuilder.factory.buildOrganizationFeature({
        organizationId: organization.id,
        featureId: feature.id,
      });

      const notAdminUserId = databaseBuilder.factory.buildUser().id;
      databaseBuilder.factory.buildMembership({
        organizationId: otherOrganization.id,
        userId: notAdminUserId,
        organizationRole: Membership.roles.MEMBER,
      });

      await databaseBuilder.commit();
      const server = await createServer();

      const options = {
        method: 'POST',
        url: `/api/organizations/${organization.id}/organization-learners/${organizationLearner.id}/features/${feature.key}`,
        headers: {
          authorization: generateValidRequestAuthorizationHeader(notAdminUserId),
        },
      };

      const response = await server.inject(options);

      // then
      expect(response.statusCode).to.equal(403);
    });

    it("should return 403 HTTP status code if params: OrganizationLearnerId don't belong to organization", async function () {
      // given
      const organization = databaseBuilder.factory.buildOrganization();
      const otherOrganization = databaseBuilder.factory.buildOrganization();
      const organizationLearnerFromOtherOrganization = databaseBuilder.factory.buildOrganizationLearner({
        organizationId: otherOrganization.id,
      });
      const feature = databaseBuilder.factory.buildFeature({
        key: ORGANIZATION_FEATURE.ORALIZATION_MANAGED_BY_PRESCRIBER.key,
      });
      databaseBuilder.factory.buildOrganizationFeature({
        organizationId: organization.id,
        featureId: feature.id,
      });

      const notAdminUserId = databaseBuilder.factory.buildUser().id;
      databaseBuilder.factory.buildMembership({
        organizationId: organization.id,
        userId: notAdminUserId,
        organizationRole: Membership.roles.MEMBER,
      });

      await databaseBuilder.commit();
      const server = await createServer();

      const options = {
        method: 'POST',
        url: `/api/organizations/${organization.id}/organization-learners/${organizationLearnerFromOtherOrganization.id}/features/${feature.key}`,
        headers: {
          authorization: generateValidRequestAuthorizationHeader(notAdminUserId),
        },
      };

      const response = await server.inject(options);

      // then
      expect(response.statusCode).to.equal(403);
    });

    it("should return 403 HTTP status code if params: featureKey isn't enabled in organization", async function () {
      // given
      const organization = databaseBuilder.factory.buildOrganization();
      const otherOrganization = databaseBuilder.factory.buildOrganization();
      const organizationLearner = databaseBuilder.factory.buildOrganizationLearner({ organizationId: organization.id });
      const feature = databaseBuilder.factory.buildFeature({
        key: ORGANIZATION_FEATURE.ORALIZATION_MANAGED_BY_PRESCRIBER.key,
      });
      databaseBuilder.factory.buildOrganizationFeature({
        organizationId: otherOrganization.id,
        featureId: feature.id,
      });

      const notAdminUserId = databaseBuilder.factory.buildUser().id;
      databaseBuilder.factory.buildMembership({
        organizationId: organization.id,
        userId: notAdminUserId,
        organizationRole: Membership.roles.MEMBER,
      });

      await databaseBuilder.commit();
      const server = await createServer();

      const options = {
        method: 'POST',
        url: `/api/organizations/${organization.id}/organization-learners/${organizationLearner.id}/features/${feature.key}`,
        headers: {
          authorization: generateValidRequestAuthorizationHeader(notAdminUserId),
        },
      };

      const response = await server.inject(options);

      // then
      expect(response.statusCode).to.equal(403);
    });
  });

  describe('DELETE /api/organizations/{organizationId}/organization-learners/{organizationLearnerId}/features/{featureKey}', function () {
    it('should return 204 HTTP status code after delete organizationLearnerFeature link', async function () {
      const organization = databaseBuilder.factory.buildOrganization();
      const organizationLearner = databaseBuilder.factory.buildOrganizationLearner({ organizationId: organization.id });
      const feature = databaseBuilder.factory.buildFeature({
        key: ORGANIZATION_FEATURE.ORALIZATION_MANAGED_BY_PRESCRIBER.key,
      });
      databaseBuilder.factory.buildOrganizationFeature({
        organizationId: organization.id,
        featureId: feature.id,
      });
      databaseBuilder.factory.prescription.organizationLearners.buildOrganizationLearnerFeature({
        organizationLearnerId: organizationLearner.id,
        featureId: feature.id,
      });

      const notAdminUserId = databaseBuilder.factory.buildUser().id;
      databaseBuilder.factory.buildMembership({
        organizationId: organization.id,
        userId: notAdminUserId,
        organizationRole: Membership.roles.MEMBER,
      });

      await databaseBuilder.commit();
      const server = await createServer();

      const options = {
        method: 'DELETE',
        url: `/api/organizations/${organization.id}/organization-learners/${organizationLearner.id}/features/${feature.key}`,
        headers: {
          authorization: generateValidRequestAuthorizationHeader(notAdminUserId),
        },
      };

      const response = await server.inject(options);

      expect(response.statusCode).to.equal(204);
    });

    it("should return 403 HTTP status code if user don't have acces", async function () {
      const organization = databaseBuilder.factory.buildOrganization();
      const otherOrganization = databaseBuilder.factory.buildOrganization();
      const organizationLearner = databaseBuilder.factory.buildOrganizationLearner({ organizationId: organization.id });
      const feature = databaseBuilder.factory.buildFeature({
        key: ORGANIZATION_FEATURE.ORALIZATION_MANAGED_BY_PRESCRIBER.key,
      });
      databaseBuilder.factory.buildOrganizationFeature({
        organizationId: organization.id,
        featureId: feature.id,
      });
      databaseBuilder.factory.prescription.organizationLearners.buildOrganizationLearnerFeature({
        organizationLearnerId: organizationLearner.id,
        featureId: feature.id,
      });

      const notAdminUserId = databaseBuilder.factory.buildUser().id;
      databaseBuilder.factory.buildMembership({
        organizationId: otherOrganization.id,
        userId: notAdminUserId,
        organizationRole: Membership.roles.MEMBER,
      });

      await databaseBuilder.commit();
      const server = await createServer();

      const options = {
        method: 'DELETE',
        url: `/api/organizations/${organization.id}/organization-learners/${organizationLearner.id}/features/${feature.key}`,
        headers: {
          authorization: generateValidRequestAuthorizationHeader(notAdminUserId),
        },
      };

      const response = await server.inject(options);

      expect(response.statusCode).to.equal(403);
    });

    it("should return 403 HTTP status code if params: OrganizationLearnerId don't belong to organization", async function () {
      const organization = databaseBuilder.factory.buildOrganization();
      const otherOrganization = databaseBuilder.factory.buildOrganization();
      const organizationLearnerFromOtherOrganization = databaseBuilder.factory.buildOrganizationLearner({
        organizationId: otherOrganization.id,
      });
      const feature = databaseBuilder.factory.buildFeature({
        key: ORGANIZATION_FEATURE.ORALIZATION_MANAGED_BY_PRESCRIBER.key,
      });
      databaseBuilder.factory.buildOrganizationFeature({
        organizationId: organization.id,
        featureId: feature.id,
      });
      databaseBuilder.factory.prescription.organizationLearners.buildOrganizationLearnerFeature({
        organizationLearnerId: organizationLearnerFromOtherOrganization.id,
        featureId: feature.id,
      });

      const notAdminUserId = databaseBuilder.factory.buildUser().id;
      databaseBuilder.factory.buildMembership({
        organizationId: organization.id,
        userId: notAdminUserId,
        organizationRole: Membership.roles.MEMBER,
      });

      await databaseBuilder.commit();
      const server = await createServer();

      const options = {
        method: 'DELETE',
        url: `/api/organizations/${organization.id}/organization-learners/${organizationLearnerFromOtherOrganization.id}/features/${feature.key}`,
        headers: {
          authorization: generateValidRequestAuthorizationHeader(notAdminUserId),
        },
      };

      const response = await server.inject(options);

      expect(response.statusCode).to.equal(403);
    });

    it("should return 403 HTTP status code if params: featureKey isn't enabled in organization", async function () {
      const organization = databaseBuilder.factory.buildOrganization();
      const otherOrganization = databaseBuilder.factory.buildOrganization();
      const organizationLearner = databaseBuilder.factory.buildOrganizationLearner({ organizationId: organization.id });
      const feature = databaseBuilder.factory.buildFeature({
        key: ORGANIZATION_FEATURE.ORALIZATION_MANAGED_BY_PRESCRIBER.key,
      });
      databaseBuilder.factory.buildOrganizationFeature({
        organizationId: otherOrganization.id,
        featureId: feature.id,
      });
      databaseBuilder.factory.prescription.organizationLearners.buildOrganizationLearnerFeature({
        organizationLearnerId: organizationLearner.id,
        featureId: feature.id,
      });

      const notAdminUserId = databaseBuilder.factory.buildUser().id;
      databaseBuilder.factory.buildMembership({
        organizationId: organization.id,
        userId: notAdminUserId,
        organizationRole: Membership.roles.MEMBER,
      });

      await databaseBuilder.commit();
      const server = await createServer();

      const options = {
        method: 'DELETE',
        url: `/api/organizations/${organization.id}/organization-learners/${organizationLearner.id}/features/${feature.key}`,
        headers: {
          authorization: generateValidRequestAuthorizationHeader(notAdminUserId),
        },
      };

      const response = await server.inject(options);

      expect(response.statusCode).to.equal(403);
    });
  });
});
