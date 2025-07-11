// eslint-disable-next-line ember/no-computed-properties-in-native-classes
import { computed } from '@ember/object';
import Model, { attr } from '@ember-data/model';
import dayjs from 'dayjs';
import find from 'lodash/find';

import { assessmentStates, certificationStatuses } from './certification';

export const juryCertificationSummaryStatuses = [
  { value: assessmentStates.ENDED_BY_SUPERVISOR, label: 'Terminée par le surveillant' },
];

const statuses = [...certificationStatuses, ...juryCertificationSummaryStatuses];
export default class JuryCertificationSummary extends Model {
  @attr() firstName;
  @attr() lastName;
  @attr() status;
  @attr() pixScore;
  @attr() createdAt;
  @attr() completedAt;
  @attr() isPublished;
  @attr() examinerComment;
  @attr() complementaryCertificationTakenLabel;
  @attr() numberOfCertificationIssueReports;
  @attr() isFlaggedAborted;
  @attr() numberOfCertificationIssueReportsWithRequiredAction;

  @computed('createdAt')
  get creationDate() {
    return dayjs(this.createdAt).format('DD/MM/YYYY, HH:mm:ss');
  }

  @computed('completedAt')
  get completionDate() {
    return this.completedAt ? dayjs(this.completedAt).format('DD/MM/YYYY, HH:mm:ss') : null;
  }

  @computed('numberOfCertificationIssueReportsWithRequiredAction')
  get numberOfCertificationIssueReportsWithRequiredActionLabel() {
    return this.numberOfCertificationIssueReportsWithRequiredAction > 0
      ? this.numberOfCertificationIssueReportsWithRequiredAction
      : '';
  }

  @computed('status')
  get statusLabel() {
    const statusWithLabel = find(statuses, { value: this.status });
    return statusWithLabel?.label;
  }

  @computed('status')
  get isCertificationStarted() {
    return this.status === 'started';
  }

  @computed('status')
  get isCertificationInError() {
    return this.status === 'error';
  }
}
