import './deprecation-workflow';
import '@1024pix/epreuves-components';

import { RSVP } from '@ember/-internals/runtime';
import Application from '@ember/application';
import * as runtime from '@glimmer/runtime';
import * as tracking from '@glimmer/tracking';
import * as validator from '@glimmer/validator';
import { init as initSentry } from '@sentry/ember';
import Ember from 'ember';
import loadInitializers from 'ember-load-initializers';
import Resolver from 'ember-resolver';
import config from 'mon-pix/config/environment';

// This is a temporary solution, see https://github.com/emberjs/ember-inspector/issues/2612
window.define('@glimmer/tracking', () => tracking);
window.define('@glimmer/runtime', () => runtime);
window.define('@glimmer/validator', () => validator);
window.define('rsvp', () => RSVP);
window.define('ember', () => ({ default: Ember }));
window.define('<my-app>/config/environment', () => ({
  default: config,
}));

if (config.sentry.enabled) {
  initSentry();
}

export default class App extends Application {
  modulePrefix = config.modulePrefix;
  podModulePrefix = config.podModulePrefix;
  Resolver = Resolver;
}

loadInitializers(App, config.modulePrefix);
