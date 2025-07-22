/**
 * @typedef {import('../index.js').ChallengeCalibrationRepository} ChallengeCalibrationRepository
 * @typedef {import('../index.js').ChallengeRepository} ChallengeRepository
 * @typedef {import('../index.js').CertificationChallengeLiveAlertRepository} CertificationChallengeLiveAlertRepository
 */
import differenceBy from 'lodash/differenceBy.js';

import { withTransaction } from '../../../../../shared/domain/DomainTransaction.js';

export const findByCertificationCourseIdAndAssessmentId = withTransaction(
  /**
   * @param {Object} params
   * @param {ChallengeCalibrationRepository} params.challengeCalibrationRepository
   * @param {CertificationChallengeLiveAlertRepository} params.certificationChallengeLiveAlertRepository
   * @param {ChallengeRepository} params.challengeRepository
   */
  async ({
    certificationCourseId,
    assessmentId,
    challengeCalibrationRepository,
    certificationChallengeLiveAlertRepository,
    challengeRepository,
  }) => {
    const flashCompatibleChallenges = await challengeRepository.findFlashCompatibleWithoutLocale({
      useObsoleteChallenges: true,
      fromArchivedCalibration: false,
    });

    const { allChallenges, askedChallenges, challengesCalibrations } = await _findByCertificationCourseId({
      compatibleChallenges: flashCompatibleChallenges,
      certificationCourseId,
      challengeCalibrationRepository,
      challengeRepository,
    });

    const { challengeCalibrationsWithoutLiveAlerts, askedChallengesWithoutLiveAlerts } =
      await _removeChallengesWithValidatedLiveAlerts(
        challengesCalibrations,
        assessmentId,
        askedChallenges,
        certificationChallengeLiveAlertRepository,
      );

    return { allChallenges, askedChallengesWithoutLiveAlerts, challengeCalibrationsWithoutLiveAlerts };
  },
);

/**
 * @param {Object} params
 * @param {ChallengeCalibrationRepository} params.challengeCalibrationRepository
 */
const _findByCertificationCourseId = async ({
  compatibleChallenges,
  certificationCourseId,
  challengeCalibrationRepository,
  challengeRepository,
}) => {
  const challengesCalibrations = await challengeCalibrationRepository.getByCertificationCourseId({
    certificationCourseId,
  });

  const askedChallenges = await challengeRepository.getMany(challengesCalibrations.map((challenge) => challenge.id));

  _restoreCalibrationValues(challengesCalibrations, askedChallenges);

  const flashCompatibleChallengesNotAskedInCertification = differenceBy(compatibleChallenges, askedChallenges, 'id');

  const allChallenges = [...askedChallenges, ...flashCompatibleChallengesNotAskedInCertification];

  return { allChallenges, askedChallenges, challengesCalibrations };
};

/**
 * @param {CertificationChallengeLiveAlertRepository} certificationChallengeLiveAlertRepository
 */
async function _removeChallengesWithValidatedLiveAlerts(
  challengesCalibrations,
  assessmentId,
  askedChallenges,
  certificationChallengeLiveAlertRepository,
) {
  const validatedLiveAlertChallengeIds =
    await certificationChallengeLiveAlertRepository.getLiveAlertValidatedChallengeIdsByAssessmentId({
      assessmentId,
    });
  const challengeCalibrationsWithoutLiveAlerts = challengesCalibrations.filter(
    (challengeCalibration) => !validatedLiveAlertChallengeIds.includes(challengeCalibration.id),
  );
  const askedChallengesWithoutLiveAlerts = askedChallenges.filter(
    (askedChallenge) => !validatedLiveAlertChallengeIds.includes(askedChallenge.id),
  );
  return { challengeCalibrationsWithoutLiveAlerts, askedChallengesWithoutLiveAlerts };
}

function _restoreCalibrationValues(challengesCalibrations, askedChallenges) {
  challengesCalibrations.forEach((certificationChallenge) => {
    const askedChallenge = askedChallenges.find(({ id }) => id === certificationChallenge.id);
    askedChallenge.discriminant = certificationChallenge.discriminant;
    askedChallenge.difficulty = certificationChallenge.difficulty;
  });
}
