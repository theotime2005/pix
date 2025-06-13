import { ChallengesReferential } from '../../../shared/domain/models/ChallengesReferential.js';
import { PartnerCertificationScoring } from './PartnerCertificationScoring.js';

export class DoubleCertificationScoring extends PartnerCertificationScoring {
  constructor({
    complementaryCertificationCourseId,
    complementaryCertificationBadgeId,
    reproducibilityRate,
    pixScore,
    minimumEarnedPix,
    hasAcquiredPixCertification,
    minimumReproducibilityRate,
    isRejectedForFraud,
  } = {}) {
    super({
      complementaryCertificationCourseId,
      complementaryCertificationBadgeId,
      isRejectedForFraud,
      hasAcquiredPixCertification,
      source: ChallengesReferential.PIX,
    });

    this.reproducibilityRate = reproducibilityRate;
    this.pixScore = pixScore;
    this.minimumEarnedPix = minimumEarnedPix;
    this.minimumReproducibilityRate = minimumReproducibilityRate;
  }

  isAcquired() {
    return (
      !this.isRejectedForFraud &&
      this.hasAcquiredPixCertification &&
      this._isAboveMinimumReproducibilityRate() &&
      this._isAboveMinimumScore()
    );
  }

  _isAboveMinimumScore() {
    return this.pixScore >= this.minimumEarnedPix;
  }

  _isAboveMinimumReproducibilityRate() {
    return this.reproducibilityRate >= this.minimumReproducibilityRate;
  }
}
