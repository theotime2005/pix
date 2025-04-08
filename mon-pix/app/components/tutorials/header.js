import { action } from '@ember/object';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

export default class Header extends Component {
  @service featureToggles;
  @service router;

  @tracked filterToggleSwitched;

  constructor(...args) {
    super(...args);
    this.filterToggleSwitched = this.router.currentRouteName === 'authenticated.user-tutorials.recommended';
  }

  @action
  switchToggle() {
    this.filterToggleSwitched = !this.filterToggleSwitched;
  }
}
