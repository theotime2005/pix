import Service, { service } from '@ember/service';
import last from 'lodash/last';
import PixWindow from 'mon-pix/utils/pix-window';

const FRANCE_TLD = 'fr';

export default class CurrentDomainService extends Service {
  @service location;

  getExtension() {
    return last(PixWindow.getLocationHostname().split('.'));
  }

  getDomain() {
    const url = new URL(this.location.getUrl())
    let domain;

    if (url.hostname == 'localhost') {
      domain = url.host;
    } else {
      domain = url.host.split('.').slice(-2).join('.')
    }

    return domain;
  }

  get isFranceDomain() {
    return this.getExtension() === FRANCE_TLD;
  }

  get isLocalhost() {
    return PixWindow.getLocationHostname() === 'localhost';
  }

  convertUrlToOrgDomain() {
    if (!this.isFranceDomain || this.isLocalhost) {
      return PixWindow.getLocationHref();
    }

    const url = new URL(PixWindow.getLocationHref());
    url.hostname = `${url.hostname.split('.fr')[0]}.org`;
    return url.toString();
  }
}
