// eslint-disable-next-line ember/no-computed-properties-in-native-classes
import { computed } from '@ember/object';
import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import dayjs from 'dayjs';

export const assessmentStates = {
  COMPLETED: 'completed',
  STARTED: 'started',
  ABORTED: 'aborted',
  ENDED_BY_SUPERVISOR: 'endedBySupervisor',
  ENDED_DUE_TO_FINALIZATION: 'endedDueToFinalization',
};

export const assessmentResultStatus = {
  CANCELLED: 'cancelled',
  ERROR: 'error',
  VALIDATED: 'validated',
  REJECTED: 'rejected',
};

export const certificationStatuses = [
  { value: assessmentResultStatus.CANCELLED, label: 'Annulée' },
  { value: assessmentStates.STARTED, label: 'Démarrée' },
  { value: assessmentResultStatus.ERROR, label: 'En erreur' },
  { value: assessmentResultStatus.VALIDATED, label: 'Validée' },
  { value: assessmentResultStatus.REJECTED, label: 'Rejetée' },
];

export default class Certification extends Model {
  @attr() sessionId;
  @attr() assessmentId;
  @attr() userId;
  @attr() firstName;
  @attr() lastName;
  @attr('date-only') birthdate;
  @attr() sex;
  @attr() birthplace;
  @attr() birthCountry;
  @attr() birthInseeCode;
  @attr() birthPostalCode;
  @attr() createdAt;
  @attr() completedAt;
  @attr() isRejectedForFraud;
  @attr() status;
  @attr() juryId;
  @attr('string') commentForCandidate;
  @attr('string') commentForOrganization;
  @attr('string') commentByJury;
  @attr() pixScore;
  @attr() competencesWithMark;
  @attr('boolean', { defaultValue: false }) isPublished;
  @attr('number') version;

  @belongsTo('complementary-certification-course-result-with-external', { async: true, inverse: null })
  complementaryCertificationCourseResultWithExternal;
  @belongsTo('common-complementary-certification-course-result', { async: true, inverse: null })
  commonComplementaryCertificationCourseResult;

  @hasMany('certification-issue-report', { async: true, inverse: 'certification' }) certificationIssueReports;

  @computed('createdAt')
  get creationDate() {
    return dayjs(this.createdAt).format('DD/MM/YYYY, HH:mm:ss');
  }

  @computed('completedAt')
  get completionDate() {
    return this.completedAt ? dayjs(this.completedAt).format('DD/MM/YYYY, HH:mm:ss') : null;
  }

  @computed('status')
  get statusLabelAndValue() {
    return certificationStatuses.find((certificationStatus) => certificationStatus.value === this.status);
  }

  @computed('isPublished')
  get publishedText() {
    const value = this.isPublished;
    return value ? 'Oui' : 'Non';
  }

  get isCertificationCancelled() {
    return this.status === assessmentResultStatus.CANCELLED;
  }

  get hasComplementaryCertifications() {
    return (
      Boolean(this.commonComplementaryCertificationCourseResult.content) ||
      Boolean(this.complementaryCertificationCourseResultWithExternal.get('pixResult'))
    );
  }

  @computed('competencesWithMark')
  get indexedCompetences() {
    const competencesWithMarks = this.competencesWithMark;
    return competencesWithMarks.reduce((result, value) => {
      result[value.competence_code] = { index: value.competence_code, level: value.level, score: value.score };
      return result;
    }, {});
  }

  @computed('indexedCompetences')
  get competences() {
    const indexedCompetences = this.indexedCompetences;
    return Object.keys(indexedCompetences)
      .sort()
      .reduce((result, value) => {
        result.push(indexedCompetences[value]);
        return result;
      }, []);
  }

  get isV3() {
    return this.version === 3;
  }

  wasBornInFrance() {
    return this.birthCountry === 'FRANCE';
  }

  getInformation() {
    return {
      firstName: this.firstName,
      lastName: this.lastName,
      birthdate: this.birthdate,
      birthplace: this.birthplace,
      sex: this.sex,
      birthInseeCode: this.birthInseeCode,
      birthPostalCode: this.birthPostalCode,
      birthCountry: this.birthCountry,
    };
  }

  updateInformation({
    firstName,
    lastName,
    birthdate,
    birthplace,
    sex,
    birthInseeCode,
    birthPostalCode,
    birthCountry,
  }) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.birthdate = birthdate;
    this.birthplace = birthplace;
    this.sex = sex;
    this.birthInseeCode = birthInseeCode;
    this.birthPostalCode = birthPostalCode;
    this.birthCountry = birthCountry;
  }
}
