import ApplicationAdapter from './application';

export default class CertificationCandidateTimelineAdapter extends ApplicationAdapter {
  namespace = 'api/admin';

  urlForQueryRecord(query) {
    const { candidateId } = query;
    if (candidateId) {
      delete query.candidateId;
      return `${this.host}/${this.namespace}/certification-candidates/${candidateId}/timeline`;
    }
    return super.urlForQuery(...arguments);
  }
}
