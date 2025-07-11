import { CandidateCreatedEvent } from '../../../../../../src/certification/enrolment/domain/models/timeline/CandidateCreatedEvent.js';
import { CertificationNotCertifiableEvent } from '../../../../../../src/certification/enrolment/domain/models/timeline/CandidateNotCertifiableEvent.js';
import { CandidateReconciledEvent } from '../../../../../../src/certification/enrolment/domain/models/timeline/CandidateReconciledEvent.js';
import { CertificationStartedEvent } from '../../../../../../src/certification/enrolment/domain/models/timeline/CertificationStartedEvent.js';
import { getCandidateTimeline } from '../../../../../../src/certification/enrolment/domain/usecases/get-candidate-timeline.js';
import { domainBuilder, expect, sinon } from '../../../../../test-helper.js';

describe('Certification | Enrolment | Unit | Domain | UseCase | get-candidate-timeline', function () {
  let candidateRepository, certificationCourseRepository, placementProfileService, deps;

  beforeEach(function () {
    candidateRepository = {
      get: sinon.stub(),
    };

    certificationCourseRepository = {
      findOneCertificationCourseByUserIdAndSessionId: sinon.stub(),
    };

    placementProfileService = {
      getPlacementProfile: sinon.stub(),
    };

    deps = {
      candidateRepository,
      certificationCourseRepository,
      placementProfileService,
    };
  });

  context('candidate creation', function () {
    it('should add the creation event to the timeline', async function () {
      // given
      const sessionId = 1234;
      const certificationCandidateId = 4567;
      const candidate = domainBuilder.certification.enrolment.buildCandidate();
      candidateRepository.get.resolves(candidate);

      // when
      const candidateTimeline = await getCandidateTimeline({
        sessionId,
        certificationCandidateId,
        ...deps,
      });

      // then
      expect(candidateTimeline.events).to.deep.equal([new CandidateCreatedEvent({ when: candidate.createdAt })]);
    });
  });

  context('candidate reconciliation', function () {
    it('should add a reconciliation event', async function () {
      // given
      const sessionId = 1234;
      const certificationCandidateId = 4567;
      const candidate = domainBuilder.certification.enrolment.buildCandidate({
        userId: 222,
        reconciledAt: new Date(),
      });
      candidateRepository.get.resolves(candidate);
      placementProfileService.getPlacementProfile.resolves(domainBuilder.buildPlacementProfile());

      // when
      const candidateTimeline = await getCandidateTimeline({
        sessionId,
        certificationCandidateId,
        ...deps,
      });

      // then
      expect(candidateTimeline.events).to.deep.includes(new CandidateReconciledEvent({ when: candidate.reconciledAt }));
    });

    context('when candidate stopped at reconciliation', function () {
      it('should detect if candidate is not certifiable', async function () {
        // given
        const sessionId = 1234;
        const certificationCandidateId = 4567;
        const candidate = domainBuilder.certification.enrolment.buildCandidate({
          userId: 222,
          reconciledAt: new Date(),
        });
        candidateRepository.get.resolves(candidate);
        certificationCourseRepository.findOneCertificationCourseByUserIdAndSessionId.resolves(null);
        const placementProfile = domainBuilder.buildPlacementProfile();
        placementProfileService.getPlacementProfile.resolves(placementProfile);

        // when
        const candidateTimeline = await getCandidateTimeline({
          sessionId,
          certificationCandidateId,
          ...deps,
        });

        // then
        expect(candidateTimeline.events).to.deep.includes(
          new CertificationNotCertifiableEvent({ when: candidate.reconciledAt }),
        );
      });
    });
  });

  context('certification startup', function () {
    it('should add a certification started event', async function () {
      // given
      const sessionId = 1234;
      const certificationCandidateId = 4567;
      candidateRepository.get.resolves(
        domainBuilder.certification.enrolment.buildCandidate({
          userId: 222,
          reconciledAt: new Date(),
        }),
      );
      const certifCourse = domainBuilder.buildCertificationCourse();
      certificationCourseRepository.findOneCertificationCourseByUserIdAndSessionId.resolves(certifCourse);

      // when
      const candidateTimeline = await getCandidateTimeline({
        sessionId,
        certificationCandidateId,
        ...deps,
      });

      // then
      expect(candidateTimeline.events).to.deep.includes(
        new CertificationStartedEvent({ when: certifCourse.getStartDate() }),
      );
    });
  });
});
