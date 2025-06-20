/**
 * @param {Object} params
 * @param {ComplementaryCertificationKey} params.complementaryCertificationKey
 * @param {number} params.alpha
 * @param {number} params.delta
 * @param {string} params.challengeId
 * @param {Date} params.createdAt
 */

export class CertificationFrameworksChallenge {
  constructor({ createdAt, challengeId, alpha, delta, complementaryCertificationKey }) {
    this.createdAt = createdAt;
    this.challengeId = challengeId;
    this.complementaryCertificationKey = complementaryCertificationKey;
    this.alpha = alpha;
    this.delta = delta;
  }

  calibrate({ alpha, delta }) {
    this.alpha = alpha;
    this.delta = delta;
  }
}
