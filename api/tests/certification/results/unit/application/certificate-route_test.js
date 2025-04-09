import { certificateController } from '../../../../../src/certification/results/application/certificate-controller.js';
import * as moduleUnderTest from '../../../../../src/certification/results/application/certificate-route.js';
import { securityPreHandlers } from '../../../../../src/shared/application/security-pre-handlers.js';
import { expect, HttpTestServer, sinon } from '../../../../test-helper.js';

describe('Certification | Results | Unit | Application | Certification Route', function () {
  let httpTestServer;

  beforeEach(async function () {
    sinon.stub(certificateController, 'findUserCertificates').returns('ok');
    sinon.stub(certificateController, 'getCertificate').callsFake((request, h) => h.response('ok').code(200));
    sinon.stub(securityPreHandlers, 'hasAtLeastOneAccessOf').returns(() => true);

    httpTestServer = new HttpTestServer();
    await httpTestServer.register(moduleUnderTest);
  });

  describe('GET /api/certifications/{certificationCourseId}', function () {
    it('should exist', async function () {
      // when
      const response = await httpTestServer.request('GET', '/api/certifications/1');

      // then
      expect(response.statusCode).to.equal(200);
    });
  });

  describe('GET /api/certifications', function () {
    it('should exist', async function () {
      // when
      const response = await httpTestServer.request('GET', '/api/certifications');

      // then
      expect(response.statusCode).to.equal(200);
    });
  });
});
