import { CertificationCandidateForSupervising } from './CertificationCandidateForSupervising.js';

export class CertificationCandidateForSupervisingV3 extends CertificationCandidateForSupervising {
  constructor({ challengeLiveAlert, ...rest }) {
    super({ ...rest });
    this.liveAlerts = challengeLiveAlert?.status ? [challengeLiveAlert] : null;
  }
}
