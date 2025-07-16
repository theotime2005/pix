import { service } from '@ember/service';
import Model, { attr, hasMany } from '@ember-data/model';

export default class CertificationCandidate extends Model {
  @service intl;
  @attr('string') firstName;
  @attr('string') lastName;
  @attr('date-only') birthdate;
  @hasMany('subscription', { async: false, inverse: null }) subscriptions;
}
