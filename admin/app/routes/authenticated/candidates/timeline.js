import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class TimelineRoute extends Route {
  @service store;

  async model(params) {
    const candidateId = params.candidate_id;
    return this.store.queryRecord('certification-candidate-timeline', { candidateId });
  }
}
