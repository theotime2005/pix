import { JobController } from '../../../../shared/application/jobs/job-controller.js';
import { AlgorithmEngineVersion } from '../../../shared/domain/models/AlgorithmEngineVersion.js';
import * as certificationAssessmentRepository from '../../../shared/infrastructure/repositories/certification-assessment-repository.js';
import { CertificationCompletedJob } from '../../domain/events/CertificationCompleted.js';
import { usecases } from '../../domain/usecases/index.js';

export class CertificationCompletedJobController extends JobController {
  constructor() {
    super(CertificationCompletedJob.name);
  }

  async handle({ data, dependencies = { certificationAssessmentRepository } }) {
    const { assessmentId, locale } = data;
    const { certificationAssessmentRepository } = dependencies;
    const certificationAssessment = await certificationAssessmentRepository.get(assessmentId);

    if (AlgorithmEngineVersion.isV3(certificationAssessment.version)) {
      await usecases.scoreCompletedV3Certification({ certificationAssessment, locale });
    } else {
      await usecases.scoreCompletedV2Certification({ certificationAssessment });
    }
  }
}
