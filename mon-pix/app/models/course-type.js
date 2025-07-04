import Model, { belongsTo } from '@ember-data/model';

export default class CourseType extends Model {
  @belongsTo('verified-code', { inverse: 'courseTypes', async: true }) verifiedCode;
}
