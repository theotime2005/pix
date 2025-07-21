import { service } from '@ember/service';

/**
 * Request manager handler adding user locale in request header.
 * See: https://github.com/emberjs/data/blob/main/guides/requests/examples/1-auth.md
 */
export default class LocaleHandler {
  @service currentDomain;
  @service locale;

  request(context, next) {
    const headers = new Headers(context.request.headers);
    headers.append('Accept-Language', this.locale.acceptLanguageHeader);

    return next(Object.assign({}, context.request, { headers }));
  }
}
