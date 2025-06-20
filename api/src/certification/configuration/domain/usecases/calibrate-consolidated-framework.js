/**
 * @typedef {import ('./index.js').CertificationFrameworksChallengeRepository} CertificationFrameworksChallengeRepository
 * @typedef {import ('./index.js').ActiveCalibratedChallengeRepository} ActiveCalibratedChallengeRepository
 * @typedef {import ('../models/CertificationFrameworksChallenge.js').CertificationFrameworksChallenge} CertificationFrameworksChallenge
 */

import { withTransaction } from '../../../../shared/domain/DomainTransaction.js';

/**
 * @param {Object} params
 * @param {CertificationFrameworksChallengeRepository} params.certificationFrameworksChallengeRepository
 * @param {ActiveCalibratedChallengeRepository} params.activeCalibratedChallengeRepository
 * @returns {Promise<void>}
 */
export const calibrateConsolidatedFramework = withTransaction(
  async ({
    createdAt,
    complementaryCertificationKey,
    certificationFrameworksChallengeRepository,
    activeCalibratedChallengeRepository,
  }) => {
    const certificationFrameworksChallenges = await certificationFrameworksChallengeRepository.find({
      complementaryCertificationKey,
      createdAt,
    });

    const challengeIds = certificationFrameworksChallenges.map(({ challengeId }) => challengeId); // Enlever pour caibration id

    const activeCalibratedChallenges = await activeCalibratedChallengeRepository.findByComplementaryKeyAndChallengeIds({
      complementaryCertificationKey,
      challengeIds, // Enlever pour calibration id
    });

    _calibrateFramework(activeCalibratedChallenges, certificationFrameworksChallenges);

    return certificationFrameworksChallengeRepository.save(certificationFrameworksChallenges);
  },
);

/**
 * @param {Array<ActiveCalibratedChallenge>} activeCalibratedChallenges
 * @param {Array<CertificationFrameworksChallenge>} certificationFrameworksChallenges
 */
const _calibrateFramework = (activeCalibratedChallenges, certificationFrameworksChallenges) => {
  for (let source = 0, target = 0; source < activeCalibratedChallenges.length; source++, target++) {
    while (activeCalibratedChallenges[source].challengeId !== certificationFrameworksChallenges[target].challengeId) {
      target++;
    }

    const frameworkChallenge = certificationFrameworksChallenges[target];
    frameworkChallenge.calibrate(activeCalibratedChallenges[source]);
  }
};
