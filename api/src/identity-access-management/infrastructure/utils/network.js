import { HttpErrors } from '../../../shared/application/http-errors.js';

const PIX_APP_APPLICATION_NAME = 'app';
const PIX_ADMIN_APPLICATION_NAME = 'admin';
const PIX_ORGA_APPLICATION_NAME = 'orga';
const PIX_CERTIF_APPLICATION_NAME = 'certif';
const PIX_JUNIOR_APPLICATION_NAME = 'junior';

const localhostApplicationPortMapping = {
  4200: PIX_APP_APPLICATION_NAME,
  4201: PIX_ORGA_APPLICATION_NAME,
  4202: PIX_ADMIN_APPLICATION_NAME,
  4203: PIX_CERTIF_APPLICATION_NAME,
  4205: PIX_JUNIOR_APPLICATION_NAME,
};

class RequestedApplication {
  /**
   * @param {string} applicationName
   */
  constructor({ origin, applicationName }) {
    this.origin = origin;
    this.applicationName = applicationName;
  }

  get isPixApp() {
    return this.applicationName == PIX_APP_APPLICATION_NAME;
  }

  get isPixAdmin() {
    return this.applicationName == PIX_ADMIN_APPLICATION_NAME;
  }

  get isPixOrga() {
    return this.applicationName == PIX_ORGA_APPLICATION_NAME;
  }

  get isPixCertif() {
    return this.applicationName == PIX_CERTIF_APPLICATION_NAME;
  }

  get isPixJunior() {
    return this.applicationName == PIX_JUNIOR_APPLICATION_NAME;
  }

  /**
   * Returns a RequestedApplication from the HTTP request headers, based on the x-forwarded-proto and x-forwarded-host headers.
   *
   * @param {Object} headers
   * @returns {RequestedApplication}
   */
  static fromHeaders(headers) {
    const protoHeader = headers['x-forwarded-proto'];
    const hostHeader = headers['x-forwarded-host'];
    if (!protoHeader || !hostHeader) {
      throw new ForwardedOriginError('Missing forwarded header(s)');
    }

    const origin = `${_getHeaderFirstValue(protoHeader)}://${_getHeaderFirstValue(hostHeader)}`;
    let url;
    try {
      url = new URL(origin);
    } catch {
      throw new ForwardedOriginError(`Invalid URL: "${origin}"`);
    }

    let applicationName;

    if (url.hostname == 'localhost') {
      applicationName = localhostApplicationPortMapping[url.port];
      return new RequestedApplication({ origin, applicationName });
    }

    const hostnameParts = url.hostname.split('.');
    if (hostnameParts.length < 2) {
      throw new ForwardedOriginError(`Unsupported hostname format: "${url.hostname}"`);
    }

    const urlFirstLabel = hostnameParts[0];

    const urlFirstLabelParts = urlFirstLabel.split('-');
    if (urlFirstLabelParts.length == 2) {
      const reviewAppSubPart = urlFirstLabelParts[0];
      applicationName = reviewAppSubPart;
    } else {
      applicationName = urlFirstLabel;
    }

    return new RequestedApplication({ origin, applicationName });
  }
}

class ForwardedOriginError extends HttpErrors.BadRequestError {
  constructor(message) {
    super(message);
  }
}

function _getHeaderFirstValue(headerValue) {
  return headerValue.split(',')[0];
}

export { ForwardedOriginError, RequestedApplication };
