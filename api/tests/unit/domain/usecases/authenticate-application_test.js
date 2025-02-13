import { authenticateApplication } from '../../../../lib/domain/usecases/authenticate-application.js';
import {
  ApplicationScopeNotAllowedError,
  ApplicationWithInvalidClientIdError,
  ApplicationWithInvalidClientSecretError,
} from '../../../../src/shared/domain/errors.js';
import { catchErr, expect, sinon } from '../../../test-helper.js';

describe('Unit | Usecase | authenticate-application', function () {
  context('when application is not found', function () {
    it('should throw an error', async function () {
      const client = {
        clientId: Symbol('id'),
        clientSecret: Symbol('secret'),
      };

      const err = await catchErr(authenticateApplication)(client);

      expect(err).to.be.instanceOf(ApplicationWithInvalidClientIdError);
    });
  });

  context('when application is found', function () {
    context('when client secrets are different', function () {
      it('should throw an error', async function () {
        const client = {
          clientId: 'test-apimOsmoseClientId',
          clientSecret: Symbol('toto'),
        };

        const err = await catchErr(authenticateApplication)(client);

        expect(err).to.be.instanceOf(ApplicationWithInvalidClientSecretError);
      });
    });

    context('when client scopes are different', function () {
      it('should throw an error', async function () {
        const client = {
          clientId: 'test-apimOsmoseClientId',
          clientSecret: 'test-apimOsmoseClientSecret',
          scope: 'mauvais-scope',
        };

        const err = await catchErr(authenticateApplication)(client);

        expect(err).to.be.instanceOf(ApplicationScopeNotAllowedError);
      });
    });

    context('when given information is correct', function () {
      it('should return created token', async function () {
        const client = {
          clientId: 'test-apimOsmoseClientId',
          clientSecret: 'test-apimOsmoseClientSecret',
          scope: 'organizations-certifications-result',
        };

        const tokenService = {
          createAccessTokenFromApplication: sinon.stub(),
        };
        const expectedToken = Symbol('Mon Super token');
        tokenService.createAccessTokenFromApplication
          .withArgs(client.clientId, 'livretScolaire', client.scope, 'test-secretOsmose', '4h')
          .resolves(expectedToken);

        const token = await authenticateApplication({ ...client, tokenService });

        expect(token).to.be.equal(expectedToken);
      });
    });
  });
});
