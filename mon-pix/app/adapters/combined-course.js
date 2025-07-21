import ApplicationAdapter from './application';

export default class CombinedCourse extends ApplicationAdapter {
  start(code) {
    const url = `${this.host}/${this.namespace}/combined-courses/${code}/start`;
    return this.ajax(url, 'PUT');
  }
}
