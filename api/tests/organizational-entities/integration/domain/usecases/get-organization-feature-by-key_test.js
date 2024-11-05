import { OrganizationFeatureItem } from '../../../../../src/organizational-entities/domain/models/OrganizationFeatureItem.js';
import { getOrganizationFeatureByKey } from '../../../../../src/organizational-entities/domain/usecases/get-organization-feature-by-key.js';
import * as organizationFeatureRepository from '../../../../../src/organizational-entities/infrastructure/repositories/organization-feature-repository.js';
import { databaseBuilder, expect } from '../../../../test-helper.js';

describe('Integration | Organizational Entities | Domain | UseCases | get-organization-feature-by-key', function () {
  it('should return an organisation feature', async function () {
    const organization = databaseBuilder.factory.buildOrganization();
    const feature1 = databaseBuilder.factory.buildFeature({
      key: 'Super feature',
    });
    const feature2 = databaseBuilder.factory.buildFeature({
      key: 'Feature pas ouf',
    });

    databaseBuilder.factory.buildOrganizationFeature({
      organizationId: organization.id,
      featureId: feature1.id,
    });

    databaseBuilder.factory.buildOrganizationFeature({
      organizationId: organization.id,
      featureId: feature2.id,
    });
    await databaseBuilder.commit();

    const result = await getOrganizationFeatureByKey({
      featureKey: feature1.key,
      organizationId: organization.id,
      organizationFeatureRepository,
    });

    expect(result).to.deep.equal(new OrganizationFeatureItem({ featureId: feature1.id, key: feature1.key }));
  });
});
