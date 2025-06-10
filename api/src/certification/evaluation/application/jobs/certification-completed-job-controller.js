import * as complementaryCertificationScoringCriteriaRepository from '../../../../../lib/infrastructure/repositories/complementary-certification-scoring-criteria-repository.js';
import { JobController } from '../../../../shared/application/jobs/job-controller.js';
import { assessmentResultRepository } from '../../../session-management/infrastructure/repositories/index.js';
import { AlgorithmEngineVersion } from '../../../shared/domain/models/AlgorithmEngineVersion.js';
import * as certificationAssessmentRepository from '../../../shared/infrastructure/repositories/certification-assessment-repository.js';
import * as certificationCourseRepository from '../../../shared/infrastructure/repositories/certification-course-repository.js';
import { CertificationCompletedJob } from '../../domain/events/CertificationCompleted.js';
import { services } from '../../domain/services/index.js';
import { usecases } from '../../domain/usecases/index.js';

export class CertificationCompletedJobController extends JobController {
  constructor() {
    super(CertificationCompletedJob.name);
  }

  async handle({
    data,
    dependencies = {
      assessmentResultRepository,
      certificationAssessmentRepository,
      complementaryCertificationScoringCriteriaRepository,
      certificationCourseRepository,
      services,
    },
  }) {
    const { assessmentId, locale } = data;

    const { certificationAssessmentRepository, certificationCourseRepository, services } = dependencies;

    const certificationAssessment = await certificationAssessmentRepository.get(assessmentId);

    if (certificationAssessment.isScoringBlockedDueToComplementaryOnlyChallenges) {
      return;
    }

    if (AlgorithmEngineVersion.isV3(certificationAssessment.version)) {
      await _handleV3CertificationScoring({
        certificationAssessment,
        locale,
        certificationCourseRepository,
        services,
      });
    } else {
      await usecases.scoreCompletedV2Certification({ certificationAssessment });
    }
  }
}

// async function _handleV2CertificationScoring({
//   certificationAssessment,
//   assessmentResultRepository,
//   certificationCourseRepository,
//   complementaryCertificationScoringCriteriaRepository,
//   services,
// }) {
//   try {
//     const { certificationCourse } = await services.handleV2CertificationScoring({
//       certificationAssessment,
//     });

//     certificationCourse.complete({ now: new Date() });
//     await certificationCourseRepository.update({ certificationCourse });

//     const complementaryCertificationScoringCriteria =
//       await complementaryCertificationScoringCriteriaRepository.findByCertificationCourseId({
//         certificationCourseId: certificationCourse.getId(),
//       });

//     if (complementaryCertificationScoringCriteria.length > 0) {
//       await services.scoreComplementaryCertificationV2({
//         certificationCourseId: certificationCourse.getId(),
//         complementaryCertificationScoringCriteria: complementaryCertificationScoringCriteria[0],
//       });
//     }
//   } catch (error) {
//     if (!(error instanceof CertificationComputeError)) {
//       throw error;
//     }
//     await _saveResultAfterCertificationComputeError({
//       certificationAssessment,
//       assessmentResultRepository,
//       certificationCourseRepository,
//       certificationComputeError: error,
//     });
//   }
// }

async function _handleV3CertificationScoring({
  certificationAssessment,
  locale,
  certificationCourseRepository,
  services,
}) {
  const certificationCourse = await services.handleV3CertificationScoring({
    certificationAssessment,
    locale,
    dependencies: { findByCertificationCourseIdAndAssessmentId: services.findByCertificationCourseIdAndAssessmentId },
  });

  certificationCourse.complete({ now: new Date() });
  return certificationCourseRepository.update({ certificationCourse });
}

// async function _saveResultAfterCertificationComputeError({
//   certificationAssessment,
//   assessmentResultRepository,
//   certificationCourseRepository,
//   certificationComputeError,
// }) {
//   const certificationCourse = await certificationCourseRepository.get({
//     id: certificationAssessment.certificationCourseId,
//   });
//   const assessmentResult = AssessmentResultFactory.buildAlgoErrorResult({
//     error: certificationComputeError,
//     assessmentId: certificationAssessment.id,
//   });
//   await assessmentResultRepository.save({
//     certificationCourseId: certificationAssessment.certificationCourseId,
//     assessmentResult,
//   });
//   certificationCourse.complete({ now: new Date() });
//   return certificationCourseRepository.update({ certificationCourse });
// }
