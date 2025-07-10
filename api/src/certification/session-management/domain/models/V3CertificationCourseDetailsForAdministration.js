export class V3CertificationCourseDetailsForAdministration {
  constructor({
    certificationCourseId,
    certificationChallengesForAdministration = [],
    isRejectedForFraud,
    createdAt,
    completedAt,
    endedAt = null,
    assessmentState,
    assessmentResultStatus,
    abortReason,
    pixScore,
    numberOfChallenges,
  }) {
    this.certificationCourseId = certificationCourseId;
    this.isRejectedForFraud = isRejectedForFraud;
    this.certificationChallengesForAdministration = certificationChallengesForAdministration;
    this.createdAt = createdAt;
    this.completedAt = completedAt;
    this.assessmentState = assessmentState;
    this.assessmentResultStatus = assessmentResultStatus;
    this.abortReason = abortReason;
    this.pixScore = pixScore;
    this.numberOfChallenges = numberOfChallenges;
    this.endedAt = endedAt;
  }

  setCompetencesDetails(competenceList) {
    this.certificationChallengesForAdministration.forEach((challenge) => {
      challenge.setCompetenceDetails(competenceList);
    });
  }
}
