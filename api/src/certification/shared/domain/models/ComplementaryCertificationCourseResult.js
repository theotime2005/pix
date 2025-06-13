import { ChallengesReferential } from './ChallengesReferential.js';

const juryOptions = {
  REJECTED: 'REJECTED',
  UNSET: 'UNSET',
};

class ComplementaryCertificationCourseResult {
  constructor({ complementaryCertificationCourseId, complementaryCertificationBadgeId, source, acquired, label } = {}) {
    this.complementaryCertificationCourseId = complementaryCertificationCourseId;
    this.complementaryCertificationBadgeId = complementaryCertificationBadgeId;
    this.acquired = acquired;
    this.source = source;
    this.label = label;
  }

  static from({ complementaryCertificationCourseId, complementaryCertificationBadgeId, acquired, source, label }) {
    return new ComplementaryCertificationCourseResult({
      complementaryCertificationCourseId,
      complementaryCertificationBadgeId,
      acquired,
      source,
      label,
    });
  }

  static buildFromJuryLevel({ complementaryCertificationCourseId, complementaryCertificationBadgeId, juryLevel }) {
    if (juryLevel === 'REJECTED') {
      return new ComplementaryCertificationCourseResult({
        complementaryCertificationCourseId,
        complementaryCertificationBadgeId,
        acquired: false,
        source: ChallengesReferential.EXTERNAL,
      });
    }

    return new ComplementaryCertificationCourseResult({
      complementaryCertificationCourseId,
      complementaryCertificationBadgeId: juryLevel,
      acquired: true,
      source: ChallengesReferential.EXTERNAL,
    });
  }

  isFromPixSource() {
    return this.source === ChallengesReferential.PIX;
  }

  isFromExternalSource() {
    return this.source === ChallengesReferential.EXTERNAL;
  }

  isAcquired() {
    return this.acquired;
  }
}

ComplementaryCertificationCourseResult.sources = ChallengesReferential;
ComplementaryCertificationCourseResult.juryOptions = juryOptions;

export { ComplementaryCertificationCourseResult, juryOptions };
