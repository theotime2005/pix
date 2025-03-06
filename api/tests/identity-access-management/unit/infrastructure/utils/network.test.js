import {
  ForwardedOriginError,
  RequestedApplication,
} from '../../../../../src/identity-access-management/infrastructure/utils/network.js';
import { expect } from '../../../../test-helper.js';

describe('Unit | Identity Access Management | Infrastructure | Utils | network', function () {
  describe('RequestedApplication', function () {
    describe('constructor', function () {
      it('initializes the origin and applicationName properties', function () {
        // given
        const origin = 'https://orga.pix.org/';
        const applicationName = 'orga';

        // when
        const requestedApplication = new RequestedApplication({ origin, applicationName });

        // then
        expect(requestedApplication.origin).to.equal('https://orga.pix.org/');
        expect(requestedApplication.applicationName).to.equal('orga');
      });
    });

    describe('#fromHeaders', function () {
      it('returns the application name as the first label in the hostname', function () {
        // given
        const headers = {
          'x-forwarded-proto': 'https',
          'x-forwarded-host': 'app.pix.org',
        };

        // when
        const requestedApplication = RequestedApplication.fromHeaders(headers);

        // then
        expect(requestedApplication).to.be.instanceOf(RequestedApplication);
        expect(requestedApplication.applicationName).to.equal('app');
        expect(requestedApplication.isPixApp).to.be.true;
        expect(requestedApplication.isPixAdmin).to.be.false;
        expect(requestedApplication.isPixOrga).to.be.false;
        expect(requestedApplication.isPixCertif).to.be.false;
        expect(requestedApplication.isPixJunior).to.be.false;
      });

      context(
        'when the x-forwarded-proto and x-forwarded-port headers have multiple values (ember serve --proxy)',
        function () {
          it('returns the application name as a sub-part of the first label in the hostname', function () {
            // given
            const headers = {
              'x-forwarded-proto': 'https,http',
              'x-forwarded-host': 'app.dev.pix.org',
            };

            // when
            const requestedApplication = RequestedApplication.fromHeaders(headers);

            // then
            expect(requestedApplication).to.be.instanceOf(RequestedApplication);
            expect(requestedApplication.applicationName).to.equal('app');
            expect(requestedApplication.isPixApp).to.be.true;
            expect(requestedApplication.isPixAdmin).to.be.false;
            expect(requestedApplication.isPixOrga).to.be.false;
            expect(requestedApplication.isPixCertif).to.be.false;
            expect(requestedApplication.isPixJunior).to.be.false;
          });
        },
      );

      context('when the application is a Review App', function () {
        it('returns the application name as a sub-part of the first label in the hostname', function () {
          // given
          const headers = {
            'x-forwarded-proto': 'https',
            'x-forwarded-host': 'app-pr11415.review.pix.org',
          };

          // when
          const requestedApplication = RequestedApplication.fromHeaders(headers);

          // then
          expect(requestedApplication).to.be.instanceOf(RequestedApplication);
          expect(requestedApplication.applicationName).to.equal('app');
          expect(requestedApplication.isPixApp).to.be.true;
          expect(requestedApplication.isPixAdmin).to.be.false;
          expect(requestedApplication.isPixOrga).to.be.false;
          expect(requestedApplication.isPixCertif).to.be.false;
          expect(requestedApplication.isPixJunior).to.be.false;
        });
      });

      context('when the application is accessed directly on localhost', function () {
        context('when port is 4200', function () {
          it('returns the application name based on port 4200', function () {
            // given
            const headers = {
              'x-forwarded-proto': 'http',
              'x-forwarded-host': 'localhost:4200',
            };

            // when
            const requestedApplication = RequestedApplication.fromHeaders(headers);

            // then
            expect(requestedApplication).to.be.instanceOf(RequestedApplication);
            expect(requestedApplication.applicationName).to.equal('app');
            expect(requestedApplication.isPixApp).to.be.true;
            expect(requestedApplication.isPixAdmin).to.be.false;
            expect(requestedApplication.isPixOrga).to.be.false;
            expect(requestedApplication.isPixCertif).to.be.false;
            expect(requestedApplication.isPixJunior).to.be.false;
          });
        });

        context('when port is 4201', function () {
          it('returns the application name based on port 4201', function () {
            // given
            const headers = {
              'x-forwarded-proto': 'http',
              'x-forwarded-host': 'localhost:4201',
            };

            // when
            const requestedApplication = RequestedApplication.fromHeaders(headers);

            // then
            expect(requestedApplication).to.be.instanceOf(RequestedApplication);
            expect(requestedApplication.applicationName).to.equal('orga');
            expect(requestedApplication.isPixApp).to.be.false;
            expect(requestedApplication.isPixAdmin).to.be.false;
            expect(requestedApplication.isPixOrga).to.be.true;
            expect(requestedApplication.isPixCertif).to.be.false;
            expect(requestedApplication.isPixJunior).to.be.false;
          });
        });

        context('when port is 4202', function () {
          it('returns the application name based on port 4202', function () {
            // given
            const headers = {
              'x-forwarded-proto': 'http',
              'x-forwarded-host': 'localhost:4202',
            };

            // when
            const requestedApplication = RequestedApplication.fromHeaders(headers);

            // then
            expect(requestedApplication).to.be.instanceOf(RequestedApplication);
            expect(requestedApplication.applicationName).to.equal('admin');
            expect(requestedApplication.isPixApp).to.be.false;
            expect(requestedApplication.isPixAdmin).to.be.true;
            expect(requestedApplication.isPixOrga).to.be.false;
            expect(requestedApplication.isPixCertif).to.be.false;
            expect(requestedApplication.isPixJunior).to.be.false;
          });
        });

        context('when port is 4203', function () {
          it('returns the application name based on port 4203', function () {
            // given
            const headers = {
              'x-forwarded-proto': 'http',
              'x-forwarded-host': 'localhost:4203',
            };

            // when
            const requestedApplication = RequestedApplication.fromHeaders(headers);

            // then
            expect(requestedApplication).to.be.instanceOf(RequestedApplication);
            expect(requestedApplication.applicationName).to.equal('certif');
            expect(requestedApplication.isPixApp).to.be.false;
            expect(requestedApplication.isPixAdmin).to.be.false;
            expect(requestedApplication.isPixOrga).to.be.false;
            expect(requestedApplication.isPixCertif).to.be.true;
            expect(requestedApplication.isPixJunior).to.be.false;
          });
        });

        context('when port is 4205', function () {
          it('returns the application name based on port 4205', function () {
            // given
            const headers = {
              'x-forwarded-proto': 'http',
              'x-forwarded-host': 'localhost:4205',
            };

            // when
            const requestedApplication = RequestedApplication.fromHeaders(headers);

            // then
            expect(requestedApplication).to.be.instanceOf(RequestedApplication);
            expect(requestedApplication.applicationName).to.equal('junior');
            expect(requestedApplication.isPixApp).to.be.false;
            expect(requestedApplication.isPixAdmin).to.be.false;
            expect(requestedApplication.isPixOrga).to.be.false;
            expect(requestedApplication.isPixCertif).to.be.false;
            expect(requestedApplication.isPixJunior).to.be.true;
          });
        });
      });

      context('error cases', function () {
        context('when the x-forwarded-proto and/or x-forwarded-port headers are not defined', function () {
          it('throws a ForwardedOriginError', function () {
            // given
            const headers = {};

            // when & then
            expect(() => RequestedApplication.fromHeaders(headers)).to.throw(
              ForwardedOriginError,
              'Missing forwarded header(s)',
            );
          });
        });

        context('when the hostname format is unsupported', function () {
          it('throws a ForwardedOriginError', function () {
            // given
            const headers = {
              'x-forwarded-proto': 'https',
              'x-forwarded-host': 'someUnsupportedHostnameFormat',
            };

            // when & then
            expect(() => RequestedApplication.fromHeaders(headers)).to.throw(
              ForwardedOriginError,
              'Unsupported hostname format: "someunsupportedhostnameformat"',
            );
          });
        });
      });
    });
  });
});
