import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class CombinedCourseRoute extends Route {
  @service store;

  async model(params) {
    return this.store.queryRecord('combined-course', { filter: { code: params.code } });
  }
}
