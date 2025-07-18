import { service } from '@ember/service';
import SessionService from 'ember-simple-auth/services/session';
import get from 'lodash/get';
import { SessionStorageEntry } from 'mon-pix/utils/session-storage-entry.js';

const externalUserTokenFromGarStorage = new SessionStorageEntry('externalUserTokenFromGar');
const userIdForLearnerAssociationStorage = new SessionStorageEntry('userIdForLearnerAssociation');

export default class CurrentSessionService extends SessionService {
  @service currentUser;
  @service currentDomain;
  @service intl;
  @service dayjs;
  @service url;
  @service router;
  @service oidcIdentityProviders;
  @service locale;

  routeAfterAuthentication = 'authenticated.user-dashboard';

  async authenticateUser(login, password) {
    this.revokeGarAuthenticationContext();

    const trimedLogin = login ? login.trim() : '';
    return this.authenticate('authenticator:oauth2', { login: trimedLogin, password });
  }

  async handleAuthentication() {
    await this._loadCurrentUserAndLocale();

    const nextURL = this.data.nextURL;
    const isFromIdentityProviderLoginPage = this.oidcIdentityProviders.list.some((identityProvider) => {
      const isUserLoggedInToIdentityProvider =
        get(this, 'data.authenticated.identityProviderCode') === identityProvider.code;
      return nextURL && isUserLoggedInToIdentityProvider;
    });

    if (isFromIdentityProviderLoginPage) {
      // eslint-disable-next-line ember/classic-decorator-no-classic-methods
      this.set('data.nextURL', undefined);
      this.router.replaceWith(nextURL);
      return;
    }

    super.handleAuthentication(this.routeAfterAuthentication);
  }

  handleInvalidation() {
    if (this.skipRedirectAfterSessionInvalidation) {
      delete this.skipRedirectAfterSessionInvalidation;
      return;
    }
    this.code = null;

    const routeAfterInvalidation = this._getRouteAfterInvalidation();
    super.handleInvalidation(routeAfterInvalidation);
  }

  async handleUserLanguageAndLocale(transition = null) {
    const queryParamLanguage = transition?.to?.queryParams?.lang;
    await this._loadCurrentUserAndLocale(queryParamLanguage);
  }

  get redirectionUrl() {
    const baseUrl = window.location.protocol + '//' + window.location.host;

    if (this.verifiedCode?.type === 'combined-course') {
      return baseUrl + this.router.urlFor('combined-courses', { code: this.verifiedCode.id });
    } else if (this.verifiedCode?.type === 'campaign') {
      return baseUrl + this.router.urlFor('campaigns', { code: this.verifiedCode.id });
    } else {
      return null;
    }
  }

  requireAuthenticationAndApprovedTermsOfService(transition, authenticationRoute) {
    if (this.isAuthenticated && this.currentUser.user.mustValidateTermsOfService) {
      this.attemptedTransition = transition;
      this.router.transitionTo('terms-of-service');
    }
    const transitionRoute = authenticationRoute ? authenticationRoute : 'authentication.login';
    super.requireAuthentication(transition, transitionRoute);
  }

  setAttemptedTransition(transition) {
    this.attemptedTransition = transition;
  }

  setVerifiedCode(verifiedCode) {
    this.verifiedCode = verifiedCode;
  }

  get isAuthenticatedByGar() {
    return Boolean(this.externalUserTokenFromGar);
  }

  get externalUserTokenFromGar() {
    return externalUserTokenFromGarStorage.get();
  }

  set externalUserTokenFromGar(token) {
    externalUserTokenFromGarStorage.set(token);
  }

  get userIdForLearnerAssociation() {
    return userIdForLearnerAssociationStorage.get();
  }

  set userIdForLearnerAssociation(userId) {
    userIdForLearnerAssociationStorage.set(userId);
  }

  revokeGarExternalUserToken() {
    externalUserTokenFromGarStorage.remove();
  }

  revokeGarAuthenticationContext() {
    externalUserTokenFromGarStorage.remove();
    userIdForLearnerAssociationStorage.remove();
  }

  async _loadCurrentUserAndLocale(language = null) {
    await this.currentUser.load();

    this.locale.setUserLocale(this.currentUser.user, language);
  }

  _getRouteAfterInvalidation() {
    const alternativeRootURL = this.alternativeRootURL;
    this.alternativeRootURL = null;

    return alternativeRootURL ? alternativeRootURL : this.url.homeUrl;
  }
}
