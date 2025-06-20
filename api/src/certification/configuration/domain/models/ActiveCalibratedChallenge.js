/**
 * @param {Object} params
 * @param {ComplementaryCertificationKey} params.scope
 * @param {number} params.alpha
 * @param {number} params.delta
 * @param {string} params.challengeId
 */

export class ActiveCalibratedChallenge {
  constructor({ scope, alpha, delta, challengeId }) {
    this.scope = scope;
    this.alpha = alpha;
    this.delta = delta;
    this.challengeId = challengeId;
  }
}
