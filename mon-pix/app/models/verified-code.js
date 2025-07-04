import Model, { attr, hasMany } from '@ember-data/model';

export default class VerifiedCode extends Model {
  @attr('string') type;
  @hasMany('course-type', { polymorphic: true, async: true }) courseTypes;
}
