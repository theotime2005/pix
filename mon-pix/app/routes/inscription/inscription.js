import Route from '@ember/routing/route';
import { service } from '@ember/service';
import get from 'lodash/get';


export default class InscriptionRoute extends Route {
  @service session;
  @service store;
  @service currentUser;

  hasAnonymousUserId = false; // propriété de classe

  beforeModel() {
    this.hasAnonymousUserId = get(this.session, 'data.authenticated.user_id') !== undefined;
    console.log(this.hasAnonymousUserId);
    if (this.session.isAuthenticated && !this.hasAnonymousUserId) {
      console.log("authentication prohibited");
      this.session.prohibitAuthentication('authenticated.user-dashboard');
    }
  }

  model() {
    // XXX: Model needs to be initialize with empty to handle validations on all fields from Api
    if (this.hasAnonymousUserId) {
      // User anonyme déjà existant : on veut le compléter
      console.log(this.currentUser.user);
      return this.currentUser.user; //cet objet doit contenir le token (avec la route /users/me)
    } else {
      return this.store.createRecord('user', {
        lastName: '',
        firstName: '',
        email: '',
        password: '',
        cgu: false,
      });
    }
  }
}
