import Model, { belongsTo, hasMany } from '@ember-data/model';

export default class CertificationConsolidatedFramework extends Model {
  @belongsTo('complementary-certification', { async: false, inverse: null }) complementaryCertification;
  @hasMany('area', { async: true, inverse: null }) areas;
  @hasMany('tubes', { async: false, inverse: null }) tubes;
}
