import { getOrganizationFeatureByKey } from '../../../../../src/organizational-entities/domain/usecases/get-organization-feature-by-key.js';
import { expect, sinon } from '../../../../test-helper.js';

describe('Unit | Organizational Entities | Domain | UseCases | get-organization-feature-by-key', function () {
  it('should call getOrganizationFeatureByKeyAndOrganizationId with correct paramaters', async function () {
    const organizationFeatureRepository = {
      getOrganizationFeatureByKeyAndOrganizationId: sinon.stub(),
    };
    const organizationId = Symbol('organizationId');
    const featureKey = Symbol('featureKey');

    await getOrganizationFeatureByKey({ featureKey, organizationId, organizationFeatureRepository });

    expect(
      organizationFeatureRepository.getOrganizationFeatureByKeyAndOrganizationId,
    ).to.have.been.calledOnceWithExactly({
      organizationId,
      featureKey,
    });
  });
});
