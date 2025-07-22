import ApplicationAdapter from './application';

export default class CombinedCourse extends ApplicationAdapter {
  start(code) {
    const url = `${this.host}/${this.namespace}/combined-courses/${code}/start`;
    return this.ajax(url, 'PUT');
  }

  urlForFindRecord(_, modelName, snapshot) {
    const { code } = snapshot.record;
    return `${this.urlForQueryRecord({ filter: { code } }, modelName)}?filter[code]=${code}`;
  }
}
