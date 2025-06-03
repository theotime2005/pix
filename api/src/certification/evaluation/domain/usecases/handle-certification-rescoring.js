/**
 * @typedef {import('./index.js').CertificationAssessmentRepository} CertificationAssessmentRepository
 * @typedef {import('./index.js').AssessmentResultRepository} AssessmentResultRepository
 * @typedef {import('../services/index.js').ScoringCertificationService} ScoringCertificationService
 * @typedef {import('./index.js').ScoringV2Service} ScoringV2Service
 * @typedef {import('./index.js').CertificationCourseRepository} CertificationCourseRepository
 * @typedef {import('./index.js').ComplementaryCertificationScoringCriteriaRepository} ComplementaryCertificationScoringCriteriaRepository
 * @typedef {import('./index.js').Services} Services
 */
import { V3_REPRODUCIBILITY_RATE } from '../../../../shared/domain/constants.js';
import { CertificationComputeError } from '../../../../shared/domain/errors.js';
import CertificationCancelled from '../../../../shared/domain/events/CertificationCancelled.js';
import { CertificationCourseUnrejected } from '../../../../shared/domain/events/CertificationCourseUnrejected.js';
import { CertificationRescoringCompleted } from '../../../../shared/domain/events/CertificationRescoringCompleted.js';
import CertificationUncancelled from '../../../../shared/domain/events/CertificationUncancelled.js';
import { checkEventTypes } from '../../../../shared/domain/events/check-event-types.js';
import { AssessmentResultFactory } from '../../../scoring/domain/models/factories/AssessmentResultFactory.js';
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
 * @typedef {certificationCourseRepository} CertificationCourseRepository
 * @typedef {services} Services
 */
async function handleCertificationRescoring({
  event,
  scoringCertificationService,
  assessmentResultRepository,
  certificationAssessmentRepository,
  certificationCourseRepository,
  complementaryCertificationScoringCriteriaRepository,
  services,
}) {
  checkEventTypes(event, eventTypes);

  const certificationAssessment = await certificationAssessmentRepository.getByCertificationCourseId({
    certificationCourseId: event.certificationCourseId,
  });

  if (certificationAssessment.isScoringBlockedDueToComplementaryOnlyChallenges) {
    return;
  }

  if (AlgorithmEngineVersion.isV3(certificationAssessment.version)) {
    // TODO : add new complementary scoring VERSION 3 (CLEA)
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
      // TODO : un service ne peut pas appeler un usecase + pourquoi
      //        scoreComplementaryCertificationV2 en usecase alors que le reste en service ?
      //        le prochain commit modifiera cela
      // await usecases.scoreComplementaryCertificationV2({
      //   certificationCourseId: certificationCourse.getId(),
      //   complementaryCertificationScoringCriteria: complementaryCertificationScoringCriteria[0],
      // });
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

  return new CertificationRescoringCompleted({
    userId: certificationAssessment.userId,
    certificationCourseId: certificationAssessment.certificationCourseId,
    reproducibilityRate: V3_REPRODUCIBILITY_RATE,
  });
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
