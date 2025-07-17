import * as certificationRepository from '../../../../../../src/certification/session-management/infrastructure/repositories/certification-repository.js';
import { AssessmentResult, status } from '../../../../../../src/shared/domain/models/AssessmentResult.js';
import { databaseBuilder, expect, knex, sinon } from '../../../../../test-helper.js';

describe('Certification | Session-management | Integration | Infrastructure | Repositories | Certification', function () {
  describe('#getStatusesBySessionId', function () {
    it('should get status information', async function () {
      // given
      const sessionId = 200;
      databaseBuilder.factory.buildSession({ id: sessionId + 1 });
      databaseBuilder.factory.buildSession({ id: sessionId });
      _buildValidatedCertification({ id: 1, sessionId, isPublished: false });
      _buildValidatedCertification({ id: 2, sessionId: sessionId + 1, isPublished: false });
      _buildRejectedCertification({ id: 3, sessionId, isPublished: false });
      _buildCancelledCertification({ id: 4, sessionId, isPublished: false });
      await databaseBuilder.commit();

      // when
      const statuses = await certificationRepository.getStatusesBySessionId(sessionId);

      // then

      expect(statuses).to.have.length(3);
      expect(statuses).to.have.deep.members([
        {
          certificationCourseId: 1,
          pixCertificationStatus: AssessmentResult.status.VALIDATED,
        },
        {
          certificationCourseId: 3,
          pixCertificationStatus: AssessmentResult.status.REJECTED,
        },
        {
          certificationCourseId: 4,
          pixCertificationStatus: AssessmentResult.status.CANCELLED,
        },
      ]);
    });
  });

  describe('#publishCertificationCoursesBySessionId', function () {
    const sessionId = 200;

    beforeEach(function () {
      databaseBuilder.factory.buildSession({ id: sessionId });
      _buildValidatedCertification({ id: 1, sessionId, isPublished: false });
      _buildRejectedCertification({ id: 2, sessionId, isPublished: false });
      _buildCancelledCertification({ id: 3, sessionId, isPublished: false });
      return databaseBuilder.commit();
    });

    context(
      'when all certification latest assessment result are validated, rejected or certification is cancelled',
      function () {
        let clock, now;

        beforeEach(function () {
          clock = sinon.useFakeTimers({
            now: new Date('2022-12-25'),
            toFake: ['Date'],
          });
          now = new Date(clock.now);
        });

        afterEach(async function () {
          clock.restore();
        });

        it('should set certifications as published within the session and update pixCertificationStatus according to assessment result status', async function () {
          // when
          await certificationRepository.publishCertificationCourses([
            { certificationCourseId: 1 },
            { certificationCourseId: 2 },
            { certificationCourseId: 3 },
          ]);

          // then
          const certifications = await knex('certification-courses')
            .select('id', 'isPublished', 'updatedAt', 'version')
            .where({ sessionId })
            .orderBy('id');
          expect(certifications).to.deep.equal([
            {
              id: 1,
              isPublished: true,
              updatedAt: now,
              version: 2,
            },
            {
              id: 2,
              isPublished: true,
              updatedAt: now,
              version: 2,
            },
            {
              id: 3,
              isPublished: true,
              updatedAt: now,
              version: 2,
            },
          ]);
        });
      },
    );
  });

  describe('#unpublishCertificationCoursesBySessionId', function () {
    const sessionId = 200;

    beforeEach(function () {
      databaseBuilder.factory.buildSession({ id: sessionId });
      _buildValidatedCertification({ id: 1, sessionId, isPublished: true });
      _buildRejectedCertification({ id: 2, sessionId, isPublished: true });
      _buildCancelledCertification({ id: 3, sessionId, isPublished: true });
      _buildErrorCertification({ id: 4, sessionId, isPublished: true });
      _buildStartedCertification({ id: 5, sessionId, isPublished: true });
      return databaseBuilder.commit();
    });

    it('should unpublish all certifications within a session and erase pixCertificationStatus', async function () {
      // when
      await certificationRepository.unpublishCertificationCoursesBySessionId({ sessionId });

      // then
      const isPublishedStates = await knex('certification-courses').pluck('isPublished').where({ sessionId });
      expect(isPublishedStates).to.deep.equal([false, false, false, false, false]);
    });
  });
});

function _buildErrorCertification({ id, sessionId, isPublished }) {
  _buildCertification({ id, sessionId, isPublished, status: status.ERROR });
}

function _buildStartedCertification({ id, sessionId, isPublished }) {
  _buildCertification({ id, sessionId, isPublished, status: null });
}

function _buildValidatedCertification({ id, sessionId, isPublished }) {
  _buildCertification({ id, sessionId, isPublished, status: status.VALIDATED });
}

function _buildRejectedCertification({ id, sessionId, isPublished }) {
  _buildCertification({ id, sessionId, isPublished, status: status.REJECTED });
}

function _buildCancelledCertification({ id, sessionId, isPublished }) {
  _buildCertification({ id, sessionId, isPublished, status: status.CANCELLED });
}

function _buildCertification({ id, sessionId, status, isPublished }) {
  databaseBuilder.factory.buildCertificationCourse({ id, sessionId, isPublished });
  databaseBuilder.factory.buildAssessment({ id, certificationCourseId: id });
  if (status) {
    // not the latest
    databaseBuilder.factory.buildAssessmentResult({
      assessmentId: id,
      createdAt: new Date('2020-01-01'),
      status,
    });
    // the latest
    databaseBuilder.factory.buildAssessmentResult.last({
      certificationCourseId: id,
      assessmentId: id,
      createdAt: new Date('2021-01-01'),
      status,
    });
  }
}
