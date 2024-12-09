import { JobController } from '../../../../shared/application/jobs/job-controller.js';
import { ParticipationStartedJob } from '../../domain/models/ParticipationStartedJob.js';
import { usecases } from '../../domain/usecases/index.js';

export class ParticipationStartedJobController extends JobController {
  constructor() {
    super(ParticipationStartedJob.name);
  }

  async handle({ data }) {
    const { campaignParticipationId } = data;

    await usecases.sendStartedParticipationResultsToPoleEmploi({ campaignParticipationId });
  }
}
