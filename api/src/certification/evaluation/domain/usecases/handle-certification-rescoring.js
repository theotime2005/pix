/**
 * @typedef {import('./index.js').CertificationAssessmentRepository} CertificationAssessmentRepository
 * @typedef {import('./index.js').AssessmentResultRepository} AssessmentResultRepository
 * @typedef {import('../services/index.js').ScoringCertificationService} ScoringCertificationService
 * @typedef {import('./index.js').ScoringV2Service} ScoringV2Service
 * @typedef {import('./index.js').CertificationCourseRepository} CertificationCourseRepository
 * @typedef {import('./index.js').ComplementaryCertificationScoringCriteriaRepository} ComplementaryCertificationScoringCriteriaRepository
 * @typedef {import('./index.js').EvaluationSessionRepository} EvaluationSessionRepository
 * @typedef {import('./index.js').Services} Services
 */
import { CertificationComputeError, NotFinalizedSessionError } from '../../../../shared/domain/errors.js';
import CertificationCancelled from '../../../../shared/domain/events/CertificationCancelled.js';
import { CertificationCourseUnrejected } from '../../../../shared/domain/events/CertificationCourseUnrejected.js';
import CertificationUncancelled from '../../../../shared/domain/events/CertificationUncancelled.js';
import { checkEventTypes } from '../../../../shared/domain/events/check-event-types.js';
import { AssessmentResultFactory } from '../../../scoring/domain/models/factories/AssessmentResultFactory.js';
import { SessionAlreadyPublishedError } from '../../../session-management/domain/errors.js';
import { CertificationCourseRejected } from '../../../session-management/domain/events/CertificationCourseRejected.js';
import { CertificationJuryDone } from '../../../session-management/domain/events/CertificationJuryDone.js';
import { AlgorithmEngineVersion } from '../../../shared/domain/models/AlgorithmEngineVersion.js';
import CertificationRescored from '../events/CertificationRescored.js';
import { ChallengeDeneutralized } from '../events/ChallengeDeneutralized.js';
import { ChallengeNeutralized } from '../events/ChallengeNeutralized.js';

const eventTypes = [
  ChallengeNeutralized,
  ChallengeDeneutralized,
  CertificationJuryDone,
  CertificationCourseRejected,
  CertificationCourseUnrejected,
  CertificationCancelled,
  CertificationRescored,
  CertificationUncancelled,
];

/**
 * @param {Object} params
 * @param {AssessmentResultRepository} params.assessmentResultRepository
 * @param {CertificationAssessmentRepository} params.certificationAssessmentRepository
 * @param {ScoringCertificationService} params.scoringCertificationService
 * @param {CertificationCourseRepository} params.certificationCourseRepository
 * @param {ComplementaryCertificationScoringCriteriaRepository} params.complementaryCertificationScoringCriteriaRepository
 * @param {CertificationCourseRepository} params.certificationCourseRepository
 * @param {EvaluationSessionRepository} params.evaluationSessionRepository
 * @param {Services} services
 *
 * @returns {Promise<void>}
 * @throws {Error} unrecognized event
 * @throws {NotFinalizedSessionError}
 * @throws {SessionAlreadyPublishedError}
 */
async function handleCertificationRescoring({
  event,
  assessmentResultRepository,
  certificationAssessmentRepository,
  certificationCourseRepository,
  complementaryCertificationScoringCriteriaRepository,
  evaluationSessionRepository,
  scoringCertificationService,
  services,
}) {
  checkEventTypes(event, eventTypes);

  const certificationCourseId = event.certificationCourseId;

  await _verifySessionIsPublishable({ certificationCourseId, evaluationSessionRepository });

  const certificationAssessment = await certificationAssessmentRepository.getByCertificationCourseId({
    certificationCourseId,
  });

  if (certificationAssessment.isScoringBlockedDueToComplementaryOnlyChallenges) {
    return;
  }

  if (AlgorithmEngineVersion.isV3(certificationAssessment.version)) {
    return _handleV3CertificationScoring({
      certificationAssessment,
      event,
      locale: event.locale,
      certificationCourseRepository,
      services,
    });
  }

  return _handleV2CertificationScoring({
    scoringCertificationService,
    certificationAssessment,
    event,
    assessmentResultRepository,
    certificationCourseRepository,
    complementaryCertificationScoringCriteriaRepository,
    services,
  });
}

/**
 * @param {Object} params
 * @param {number} params.certificationCourseId
 * @param {EvaluationSessionRepository} params.evaluationSessionRepository
 *
 * @returns {Promise<void>}
 * @throws {NotFinalizedSessionError}
 * @throws {SessionAlreadyPublishedError}
 */
const _verifySessionIsPublishable = async ({ certificationCourseId, evaluationSessionRepository }) => {
  const session = await evaluationSessionRepository.getByCertificationCourseId({ certificationCourseId });

  if (!session.isFinalized) {
    throw new NotFinalizedSessionError();
  }

  if (session.isPublished) {
    throw new SessionAlreadyPublishedError();
  }
};

async function _handleV2CertificationScoring({
  event,
  certificationAssessment,
  assessmentResultRepository,
  certificationCourseRepository,
  complementaryCertificationScoringCriteriaRepository,
  scoringCertificationService,
  services,
}) {
  try {
    const { certificationCourse, certificationAssessmentScore } = await services.handleV2CertificationScoring({
      event,
      certificationAssessment,
    });

    // isCancelled will be removed
    // this block will be removed
    await _toggleCertificationCourseCancellationIfNotTrustableOrLackOfAnswersForTechnicalReason({
      certificationCourse,
      hasEnoughNonNeutralizedChallengesToBeTrusted:
        certificationAssessmentScore.hasEnoughNonNeutralizedChallengesToBeTrusted,
      certificationCourseRepository,
      certificationAssessmentScore,
      scoringCertificationService,
    });

    const complementaryCertificationScoringCriteria =
      await complementaryCertificationScoringCriteriaRepository.findByCertificationCourseId({
        certificationCourseId: certificationCourse.getId(),
      });

    if (complementaryCertificationScoringCriteria.length > 0) {
      await services.scoreComplementaryCertificationV2({
        certificationCourseId: certificationCourse.getId(),
        complementaryCertificationScoringCriteria: complementaryCertificationScoringCriteria[0],
      });
    }
  } catch (error) {
    if (!(error instanceof CertificationComputeError)) {
      throw error;
    }
    await _saveResultAfterCertificationComputeError({
      certificationAssessment,
      assessmentResultRepository,
      certificationComputeError: error,
      juryId: event.juryId,
    });
  }
}

async function _handleV3CertificationScoring({
  certificationAssessment,
  event,
  locale,
  certificationCourseRepository,
  services,
}) {
  const certificationCourse = await services.handleV3CertificationScoring({
    event,
    certificationAssessment,
    locale,
    dependencies: { findByCertificationCourseIdAndAssessmentId: services.findByCertificationCourseIdAndAssessmentId },
  });

  // isCancelled will be removed
  if (certificationCourse.isCancelled()) {
    await certificationCourseRepository.update({ certificationCourse });
  }
}

async function _toggleCertificationCourseCancellationIfNotTrustableOrLackOfAnswersForTechnicalReason({
  certificationCourse,
  hasEnoughNonNeutralizedChallengesToBeTrusted,
  certificationCourseRepository,
  certificationAssessmentScore,
  scoringCertificationService,
}) {
  const lackOfAnswersForTechnicalReason = await scoringCertificationService.isLackOfAnswersForTechnicalReason({
    certificationCourse,
    certificationAssessmentScore,
  });

  if (!hasEnoughNonNeutralizedChallengesToBeTrusted || lackOfAnswersForTechnicalReason) {
    certificationCourse.cancel();
  } else {
    certificationCourse.uncancel();
  }

  return certificationCourseRepository.update({ certificationCourse });
}

async function _saveResultAfterCertificationComputeError({
  certificationAssessment,
  assessmentResultRepository,
  certificationComputeError,
  juryId,
}) {
  const assessmentResult = AssessmentResultFactory.buildAlgoErrorResult({
    error: certificationComputeError,
    assessmentId: certificationAssessment.id,
    juryId,
  });
  await assessmentResultRepository.save({
    certificationCourseId: certificationAssessment.certificationCourseId,
    assessmentResult,
  });
}

handleCertificationRescoring.eventTypes = eventTypes;
export { handleCertificationRescoring };
