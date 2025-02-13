import { clientApplicationRepository } from '../../../../../src/identity-access-management/infrastructure/repositories/client-application.repository.js';
import { databaseBuilder, domainBuilder, expect } from '../../../../test-helper.js';

describe('Integration | Identity Access Management | Infrastructure | Repository | client-application', function () {
  describe('#findByClientId', function () {
    let application2;

    beforeEach(async function () {
      databaseBuilder.factory.buildClientApplication({
        name: 'appli1',
        clientId: 'clientId-appli1',
        clientSecret: 'secret-app1',
        scopes: ['scope1', 'scope2'],
      });
      application2 = databaseBuilder.factory.buildClientApplication({
        name: 'appli2',
        clientId: 'clientId-appli2',
        clientSecret: 'secret-app2',
        scopes: ['scope3', 'scope4', 'scope5'],
      });

      await databaseBuilder.commit();
    });

    context('when application name is not found', function () {
      it('should return undefined', async function () {
        // given
        const clientId = 'clientId-appli3';

        // when
        const application = await clientApplicationRepository.findByClientId(clientId);

        // then
        expect(application).to.be.undefined;
      });
    });

    context('when application name is found', function () {
      it('should return the application model', async function () {
        // given
        const clientId = 'clientId-appli2';

        // when
        const application = await clientApplicationRepository.findByClientId(clientId);

        // then
        expect(application).to.deepEqualInstance(domainBuilder.buildClientApplication(application2));
      });
    });
  });
});
