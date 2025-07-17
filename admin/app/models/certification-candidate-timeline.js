import Model, { attr } from '@ember-data/model';

export default class CertificationCandidateTimeline extends Model {
  @attr() events;
}
