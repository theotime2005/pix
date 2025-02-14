import { authentication, validateUser } from '../../../lib/infrastructure/authentication.js';
import { RevokedUserAccess } from '../../../src/identity-access-management/domain/models/RevokedUserAccess.js';
import { revokedUserAccessRepository } from '../../../src/identity-access-management/infrastructure/repositories/revoked-user-access.repository.js';
import { tokenService } from '../../../src/shared/domain/services/token-service.js';
import { expect, sinon } from '../../test-helper.js';

describe('Unit | Infrastructure | Authentication', function () {
  beforeEach(function () {
    sinon.stub(tokenService, 'extractTokenFromAuthChain');
    sinon.stub(tokenService, 'getDecodedToken');
  });

  describe('when there is no authorization header in the request', function () {
    it('should throw an error', async function () {
      // given
      const request = { headers: {} };
      const h = { authenticated: sinon.stub() };

      // when
      const { authenticate } = authentication.schemes.jwt.scheme(undefined, {
        key: 'dummy-secret',
        validate: sinon.stub(),
      });
      const response = await authenticate(request, h);

      // then
      expect(response.output.payload).to.include({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Unauthorized',
      });
    });
  });

  describe('when there is an authorization header in the request', function () {
    describe('when there is no access token in the authorization header', function () {
      it('should throw an error', async function () {
        // given
        const request = { headers: { authorization: 'Bearer' } };
        const h = { authenticated: sinon.stub() };
        tokenService.extractTokenFromAuthChain.withArgs('Bearer').returns(null);

        // when
        const { authenticate } = authentication.schemes.jwt.scheme(undefined, {
          key: 'dummy-secret',
          validate: sinon.stub(),
        });
        const response = await authenticate(request, h);

        // then
        expect(response.output.payload).to.include({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Unauthorized',
        });
      });
    });

    describe('when access token can not be decoded', function () {
      it('should throw an error', async function () {
        // given
        const request = {
          headers: { authorization: 'Bearer token', 'x-forwarded-proto': 'https', 'x-forwarded-host': 'app.pix.fr' },
        };
        const h = { authenticated: sinon.stub() };
        tokenService.extractTokenFromAuthChain.withArgs('Bearer token').returns('token');
        tokenService.getDecodedToken.withArgs('token', 'dummy-secret').returns(false);

        // when
        const { authenticate } = authentication.schemes.jwt.scheme(undefined, {
          key: 'dummy-secret',
          validate: sinon.stub(),
        });
        const response = await authenticate(request, h);

        // then
        expect(response.output.payload).to.include({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Unauthorized',
        });
      });
    });
  });

  describe('#validateUser', function () {
    describe('when isUserTokenAudConfinementEnabled is enabled', function () {
      describe('when there is a user Id', function () {
        describe('when the audience is different from the forwarded origin', function () {
          it('should throw an error', async function () {
            // given
            const request = {
              headers: {
                authorization: 'Bearer token',
                'x-forwarded-proto': 'https',
                'x-forwarded-host': 'app.pix.fr',
              },
            };
            const h = { authenticated: sinon.stub() };
            tokenService.extractTokenFromAuthChain.withArgs('Bearer token').returns('token');
            tokenService.getDecodedToken.withArgs('token', 'dummy-secret').returns({
              user_id: 'user_id',
              aud: 'https://wrong.audience.fr',
            });

            // when
            const { authenticate } = authentication.schemes.jwt.scheme(undefined, {
              key: 'dummy-secret',
              validate: (request, h, options) => validateUser(request, h, { ...options, revokedUserAccessRepository }),
            });
            const response = await authenticate(request, h);

            // then
            expect(response.output.payload).to.include({
              statusCode: 401,
              error: 'Unauthorized',
              message: 'Unauthorized',
            });
          });
        });

        describe('when the user access is revoked', function () {
          it('should throw an error', async function () {
            // given
            const date = new Date();
            const revokedUserAccess = new RevokedUserAccess(date.getTime() / 1000);
            sinon.stub(revokedUserAccessRepository, 'findByUserId').resolves(revokedUserAccess);
            sinon.stub(revokedUserAccess, 'isAccessTokenRevoked').returns(true);

            const request = {
              headers: {
                authorization: 'Bearer token',
                'x-forwarded-proto': 'https',
                'x-forwarded-host': 'app.pix.fr',
              },
            };
            const h = { authenticated: sinon.stub() };
            tokenService.extractTokenFromAuthChain.withArgs('Bearer token').returns('token');
            tokenService.getDecodedToken.withArgs('token', 'dummy-secret').returns({
              user_id: 'user_id',
              aud: 'https://app.pix.fr',
            });

            // when
            const { authenticate } = authentication.schemes.jwt.scheme(undefined, {
              key: 'dummy-secret',
              validate: (request, h, options) => validateUser(request, h, { ...options, revokedUserAccessRepository }),
            });
            const response = await authenticate(request, h);

            // then
            expect(h.authenticated).to.not.have.been.called;
            expect(response.output.payload).to.include({
              statusCode: 401,
              error: 'Unauthorized',
              message: 'Unauthorized',
            });
          });
        });

        describe('when there is no forwarded origin in the request', function () {
          it('should throw an error', async function () {
            // given
            const request = {
              headers: {
                authorization: 'Bearer token',
              },
            };

            const h = { authenticated: sinon.stub() };
            tokenService.extractTokenFromAuthChain.withArgs('Bearer token').returns('token');
            tokenService.getDecodedToken.withArgs('token', 'dummy-secret').returns({
              user_id: 'user_id',
              aud: 'https://app.pix.fr',
            });

            // when
            const { authenticate } = authentication.schemes.jwt.scheme(undefined, {
              key: 'dummy-secret',
              validate: (request, h, options) => validateUser(request, h, { ...options, revokedUserAccessRepository }),
            });
            const response = await authenticate(request, h);

            // then
            expect(response.output.payload).to.include({
              statusCode: 401,
              error: 'Unauthorized',
              message: 'Unauthorized',
            });
          });
        });

        describe('when the audience is the same than the forwarded origin', function () {
          it('should not throw an error', async function () {
            // given
            const request = {
              headers: {
                authorization: 'Bearer token',
                'x-forwarded-proto': 'https',
                'x-forwarded-host': 'app.pix.fr',
              },
            };
            const h = { authenticated: sinon.stub() };
            tokenService.extractTokenFromAuthChain.withArgs('Bearer token').returns('token');
            tokenService.getDecodedToken.withArgs('token', 'dummy-secret').returns({
              user_id: 'user_id',
              aud: 'https://app.pix.fr',
            });

            // when
            const { authenticate } = authentication.schemes.jwt.scheme(undefined, {
              key: 'dummy-secret',
              validate: (request, h, options) => validateUser(request, h, { ...options, revokedUserAccessRepository }),
            });
            await authenticate(request, h);

            // then
            expect(h.authenticated).to.have.been.calledWithExactly({ credentials: { userId: 'user_id' } });
          });
        });
      });

      describe('when there is no user Id', function () {
        it('should not throw an error', async function () {
          // given
          const request = {
            headers: {
              authorization: 'Bearer token',
              'x-forwarded-proto': 'https',
              'x-forwarded-host': 'app.pix.fr',
            },
          };
          const h = { authenticated: sinon.stub() };
          tokenService.extractTokenFromAuthChain.withArgs('Bearer token').returns('token');
          tokenService.getDecodedToken.withArgs('token', 'dummy-secret').returns({
            aud: 'https://app.pix.fr',
          });

          // when
          const { authenticate } = authentication.schemes.jwt.scheme(undefined, {
            key: 'dummy-secret',
            validate: (request, h, options) => validateUser(request, h, { ...options, revokedUserAccessRepository }),
          });
          await authenticate(request, h);

          // then
          expect(h.authenticated).to.have.been.calledWithExactly({ credentials: { userId: undefined } });
        });
      });
    });
  });
});
