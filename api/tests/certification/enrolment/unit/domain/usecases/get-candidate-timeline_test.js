import { CandidateCreatedEvent } from '../../../../../../src/certification/enrolment/domain/models/timeline/CandidateCreatedEvent.js';
import { CandidateReconciledEvent } from '../../../../../../src/certification/enrolment/domain/models/timeline/CandidateReconciledEvent.js';
import { CandidateTimeline } from '../../../../../../src/certification/enrolment/domain/models/timeline/CandidateTimeline.js';
import { getCandidateTimeline } from '../../../../../../src/certification/enrolment/domain/usecases/get-candidate-timeline.js';
import { domainBuilder, expect, sinon } from '../../../../../test-helper.js';

describe('Certification | Enrolment | Unit | Domain | UseCase | get-candidate-timeline', function () {
  let candidateRepository;

  beforeEach(function () {
    candidateRepository = {
      get: sinon.stub(),
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
        candidateRepository,
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

      // when
      const candidateTimeline = await getCandidateTimeline({
        sessionId,
        certificationCandidateId,
        candidateRepository,
      });

      // then
      expect(candidateTimeline.events).to.deep.includes(new CandidateReconciledEvent({ when: candidate.reconciledAt }));
    });
  });
});
