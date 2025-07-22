import * as calibratedChallengeService from '../../../../../../../src/certification/evaluation/domain/services/scoring/calibrated-challenge-service.js';
import { config } from '../../../../../../../src/shared/config.js';
import { DomainTransaction } from '../../../../../../../src/shared/domain/DomainTransaction.js';
import { domainBuilder, expect, sinon } from '../../../../../../test-helper.js';
import { generateChallengeList } from '../../../../../shared/fixtures/challenges.js';

const { minimumAnswersRequiredToValidateACertification } = config.v3Certification.scoring;

describe('Certification | Evaluation | Unit | Domain | Services | calibrated challenge service', function () {
  context('#findByCertificationCourseIdAndAssessmentId', function () {
    let challengeCalibrationRepository,
      challengeRepository,
      certificationChallengeLiveAlertRepository,
      certificationCourseRepository,
      originalLatestCalibrationDate;

    let challengeList;

    beforeEach(function () {
      sinon.stub(DomainTransaction, 'execute').callsFake((callback) => {
        return callback();
      });

      challengeList = generateChallengeList({ length: minimumAnswersRequiredToValidateACertification + 1 });

      challengeCalibrationRepository = {
        getByCertificationCourseId: sinon.stub().rejects(new Error('Args mismatch')),
      };

      certificationCourseRepository = { get: sinon.stub() };

      certificationChallengeLiveAlertRepository = {
        getLiveAlertValidatedChallengeIdsByAssessmentId: sinon.stub(),
      };

      challengeRepository = {
        findFlashCompatibleWithoutLocale: sinon
          .stub()
          .withArgs({
            useObsoleteChallenges: true,
            fromArchivedCalibration: false,
          })
          .resolves(challengeList),
        getMany: sinon.stub(),
      };

      originalLatestCalibrationDate = config.v3Certification.latestCalibrationDate;
    });

    afterEach(function () {
      config.v3Certification.latestCalibrationDate = originalLatestCalibrationDate;
    });

    context('when there are no validated live alerts', function () {
      it('should return askedChallenges, allChallenges and challengeCalibrations', async function () {
        // given
        const certificationCourseId = 1234;
        const assessmentId = 5678;
        const challengesAfterCalibration = challengeList.slice(1);

        const challengeExcludedFromCalibration = domainBuilder.buildChallenge({
          ...challengeList[0],
          discriminant: null,
          difficulty: null,
        });

        const expectedChallengeCalibrations = _buildDataFromAnsweredChallenges(challengeList, challengeRepository);

        const expectedAskedChallenges = [challengeExcludedFromCalibration, ...challengesAfterCalibration];

        certificationChallengeLiveAlertRepository.getLiveAlertValidatedChallengeIdsByAssessmentId
          .withArgs({ assessmentId })
          .resolves([]);

        challengeRepository.getMany.withArgs(challengeList.map((e) => e.id)).returns(expectedAskedChallenges);

        challengeCalibrationRepository.getByCertificationCourseId
          .withArgs({ certificationCourseId })
          .resolves(expectedChallengeCalibrations);

        challengeRepository.findFlashCompatibleWithoutLocale
          .withArgs({
            useObsoleteChallenges: true,
            fromArchivedCalibration: false,
          })
          .resolves(challengesAfterCalibration);

        certificationCourseRepository.get
          .withArgs({ id: certificationCourseId })
          .resolves(
            domainBuilder.buildCertificationCourse({ id: certificationCourseId, createdAt: new Date('2025-06-23') }),
          );

        // when
        const {
          allChallenges,
          askedChallengesWithoutLiveAlerts: askedChallenges,
          challengeCalibrationsWithoutLiveAlerts: challengeCalibrations,
        } = await calibratedChallengeService.findByCertificationCourseIdAndAssessmentId({
          certificationCourseId,
          assessmentId,
          challengeCalibrationRepository,
          certificationChallengeLiveAlertRepository,
          certificationCourseRepository,
          challengeRepository,
        });

        // then
        expect(challengeCalibrations).to.deep.equal(expectedChallengeCalibrations);
        expect(askedChallenges).to.deep.equal(expectedAskedChallenges);
        expect(allChallenges).to.deep.equal(challengeList);
      });
    });

    context('when there are validated live alerts', function () {
      it('should return asked challenges without live alerts, all challenges and challenge calibrations without live alerts', async function () {
        // given
        const certificationCourseId = 1234;
        const assessmentId = 5678;
        const challengesAfterCalibration = challengeList.slice(1);

        const challengeExcludedFromCalibration = domainBuilder.buildChallenge({
          ...challengeList[0],
          discriminant: null,
          difficulty: null,
        });

        const challengeWithValidatedLiveAlert = domainBuilder.buildChallenge({
          ...challengeList.at(-1),
        });

        const challengeCalibrations = _buildDataFromAnsweredChallenges(challengeList, challengeRepository);

        const askedChallenges = [challengeExcludedFromCalibration, ...challengesAfterCalibration];

        certificationChallengeLiveAlertRepository.getLiveAlertValidatedChallengeIdsByAssessmentId
          .withArgs({ assessmentId })
          .resolves([challengeWithValidatedLiveAlert.id]);

        challengeRepository.getMany.withArgs(challengeList.map((e) => e.id)).returns(askedChallenges);

        challengeCalibrationRepository.getByCertificationCourseId
          .withArgs({ certificationCourseId })
          .resolves(challengeCalibrations);

        challengeRepository.findFlashCompatibleWithoutLocale
          .withArgs({
            useObsoleteChallenges: true,
            fromArchivedCalibration: false,
          })
          .resolves(challengesAfterCalibration);

        const expectedAskedChallengesWithoutLiveAlerts = askedChallenges.slice(0, -1);
        certificationCourseRepository.get
          .withArgs({ id: certificationCourseId })
          .resolves(
            domainBuilder.buildCertificationCourse({ id: certificationCourseId, createdAt: new Date('2025-06-23') }),
          );

        const expectedChallengeCalibrations = challengeCalibrations.slice(0, -1);

        // when
        const { allChallenges, askedChallengesWithoutLiveAlerts, challengeCalibrationsWithoutLiveAlerts } =
          await calibratedChallengeService.findByCertificationCourseIdAndAssessmentId({
            certificationCourseId,
            assessmentId,
            challengeCalibrationRepository,
            certificationChallengeLiveAlertRepository,
            certificationCourseRepository,
            challengeRepository,
          });

        // then
        expect(challengeCalibrationsWithoutLiveAlerts).to.deep.equal(expectedChallengeCalibrations);
        expect(askedChallengesWithoutLiveAlerts).to.deep.equal(expectedAskedChallengesWithoutLiveAlerts);
        expect(allChallenges).to.deep.equal(challengeList);
      });
    });

    context('when certification course is prior to latest calibration', function () {
      it('should return askedChallenges, allChallenges and challengeCalibrations', async function () {
        // given
        const certificationCourseId = 1234;
        const assessmentId = 5678;
        const challengesAfterCalibration = challengeList.slice(1);

        const challengeExcludedFromCalibration = domainBuilder.buildChallenge({
          ...challengeList[0],
          discriminant: null,
          difficulty: null,
        });

        const expectedChallengeCalibrations = _buildDataFromAnsweredChallenges(challengeList, challengeRepository);

        const expectedAskedChallenges = [challengeExcludedFromCalibration, ...challengesAfterCalibration];

        certificationCourseRepository.get
          .withArgs({ id: certificationCourseId })
          .resolves(
            domainBuilder.buildCertificationCourse({ id: certificationCourseId, createdAt: new Date('2025-06-23') }),
          );
        certificationChallengeLiveAlertRepository.getLiveAlertValidatedChallengeIdsByAssessmentId
          .withArgs({ assessmentId })
          .resolves([]);

        challengeRepository.getMany.withArgs(challengeList.map((e) => e.id)).returns(expectedAskedChallenges);

        challengeCalibrationRepository.getByCertificationCourseId
          .withArgs({ certificationCourseId })
          .resolves(expectedChallengeCalibrations);

        challengeRepository.findFlashCompatibleWithoutLocale.resolves(challengesAfterCalibration);

        certificationCourseRepository.get
          .withArgs({ id: certificationCourseId })
          .resolves(
            domainBuilder.buildCertificationCourse({ id: certificationCourseId, createdAt: new Date('2025-06-20') }),
          );
        config.v3Certification.latestCalibrationDate = new Date('2025-06-23');

        // when
        await calibratedChallengeService.findByCertificationCourseIdAndAssessmentId({
          certificationCourseId,
          assessmentId,
          challengeCalibrationRepository,
          certificationChallengeLiveAlertRepository,
          certificationCourseRepository,
          challengeRepository,
        });

        // then
        expect(challengeRepository.findFlashCompatibleWithoutLocale).to.have.been.calledOnceWithExactly({
          useObsoleteChallenges: true,
          fromArchivedCalibration: false,
        });
      });
    });

    context('when certification course is posterior to latest calibration', function () {
      it('should return askedChallenges, allChallenges and challengeCalibrations', async function () {
        // given
        const certificationCourseId = 1234;
        const assessmentId = 5678;
        const challengesAfterCalibration = challengeList.slice(1);

        const challengeExcludedFromCalibration = domainBuilder.buildChallenge({
          ...challengeList[0],
          discriminant: null,
          difficulty: null,
        });

        const expectedChallengeCalibrations = _buildDataFromAnsweredChallenges(challengeList, challengeRepository);

        const expectedAskedChallenges = [challengeExcludedFromCalibration, ...challengesAfterCalibration];

        certificationChallengeLiveAlertRepository.getLiveAlertValidatedChallengeIdsByAssessmentId
          .withArgs({ assessmentId })
          .resolves([]);

        challengeRepository.getMany.withArgs(challengeList.map((e) => e.id)).returns(expectedAskedChallenges);

        challengeCalibrationRepository.getByCertificationCourseId
          .withArgs({ certificationCourseId })
          .resolves(expectedChallengeCalibrations);

        challengeRepository.findFlashCompatibleWithoutLocale
          .withArgs({
            useObsoleteChallenges: true,
            fromArchivedCalibration: false,
          })
          .resolves(challengesAfterCalibration);

        certificationCourseRepository.get
          .withArgs({ id: certificationCourseId })
          .resolves(
            domainBuilder.buildCertificationCourse({ id: certificationCourseId, createdAt: new Date('2025-06-25') }),
          );
        config.v3Certification.latestCalibrationDate = new Date('2025-06-23');
        // when
        await calibratedChallengeService.findByCertificationCourseIdAndAssessmentId({
          certificationCourseId,
          assessmentId,
          challengeCalibrationRepository,
          certificationChallengeLiveAlertRepository,
          certificationCourseRepository,
          challengeRepository,
        });

        // then
        expect(challengeRepository.findFlashCompatibleWithoutLocale).to.have.been.calledOnceWithExactly({
          useObsoleteChallenges: true,
          fromArchivedCalibration: false,
        });
      });
    });
  });
});

const _generateChallengeCalibrations = ({ discriminant, difficulty, id }) => {
  return domainBuilder.certification.scoring.buildChallengeCalibration({
    id,
    discriminant,
    difficulty,
    certificationChallengeId: `certification-challenge-id-for-${id}`,
  });
};

const _buildDataFromAnsweredChallenges = (challengeList, challengeRepository) => {
  const challengeCalibrations = challengeList.map(_generateChallengeCalibrations);
  challengeRepository.getMany.withArgs(challengeList.map((e) => e.id)).returns(challengeList);
  return challengeCalibrations;
};
