import * as serializer from '../../../../../../src/certification/enrolment/infrastructure/serializers/session-candidate-serializer.js';
import { SUBSCRIPTION_TYPES } from '../../../../../../src/certification/shared/domain/constants.js';
import { CertificationCandidate } from '../../../../../../src/shared/domain/models/index.js';
import { domainBuilder, expect } from '../../../../../test-helper.js';

describe('Certification | Enrolment | Unit | Serializer | session-candidate-serializer', function () {
  describe('#serialize()', function () {
    it('should convert a EnrolledCandidate model object with subscriptions into JSON API data', function () {
      // given
      const sessionCandidate = domainBuilder.certification.enrolment.buildEnrolledCandidate({
        id: 123,
        firstName: 'Michel',
        lastName: 'Jacques',
        sex: 'M',
        birthPostalCode: 'somePostalCode1',
        birthINSEECode: 'someInseeCode1',
        birthCity: 'someBirthCity1',
        birthProvinceCode: 'someProvinceCode1',
        birthCountry: 'someBirthCountry1',
        email: 'michel.jacques@example.net',
        resultRecipientEmail: 'jeanette.jacques@example.net',
        externalId: 'MICHELJACQUES',
        birthdate: '1990-01-01',
        extraTimePercentage: null,
        userId: 159,
        organizationLearnerId: null,
        billingMode: CertificationCandidate.BILLING_MODES.PAID,
        prepaymentCode: 'somePrepaymentCode1',
        hasSeenCertificationInstructions: true,
        subscriptions: [
          domainBuilder.certification.enrolment.buildCoreSubscription({
            certificationCandidateId: 123,
          }),
          domainBuilder.certification.enrolment.buildComplementarySubscription({
            certificationCandidateId: 123,
            complementaryCertificationId: 456,
          }),
        ],
        accessibilityAdjustmentNeeded: true,
      });
      const expectedJsonApiData = {
        data: {
          type: 'certification-candidates',
          id: sessionCandidate.id.toString(),
          attributes: {
            'first-name': sessionCandidate.firstName,
            'last-name': sessionCandidate.lastName,
            birthdate: sessionCandidate.birthdate,
          },
          relationships: {
            subscriptions: {
              data: [
                {
                  type: 'subscriptions',
                  id: `${sessionCandidate.id}-CORE`,
                },
                {
                  type: 'subscriptions',
                  id: `${sessionCandidate.id}-456`,
                },
              ],
            },
          },
        },
        included: [
          {
            type: 'subscriptions',
            id: `${sessionCandidate.id}-CORE`,
            attributes: {
              'complementary-certification-id': null,
              type: SUBSCRIPTION_TYPES.CORE,
            },
          },
          {
            type: 'subscriptions',
            id: `${sessionCandidate.id}-456`,
            attributes: {
              'complementary-certification-id': 456,
              type: SUBSCRIPTION_TYPES.COMPLEMENTARY,
            },
          },
        ],
      };

      // when
      const jsonApi = serializer.serialize(sessionCandidate);

      // then
      expect(jsonApi).to.deep.equal(expectedJsonApiData);
    });
  });
});
