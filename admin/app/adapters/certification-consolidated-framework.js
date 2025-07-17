import ApplicationAdapter from './application';

export default class CertificationConsolidatedFrameworkAdapter extends ApplicationAdapter {
  namespace = 'api/admin';

  createRecord(store, type, snapshot) {
    const complementaryCertification = snapshot.record.get('complementaryCertification');

    const url = `${this.buildURL('complementary-certifications', complementaryCertification.get('key'))}/consolidated-framework`;
    const payload = {
      data: {
        data: {
          attributes: {
            tubeIds: snapshot.hasMany('tubes').map((tube) => tube.id),
          },
        },
      },
    };

    return this.ajax(url, 'POST', payload);
  }

  findRecord(store, type, complementaryCertificationKey) {
    const url = `${this.buildURL('complementary-certifications', complementaryCertificationKey)}/current-consolidated-framework`;

    return this.ajax(url, 'GET', {});
  }
}
