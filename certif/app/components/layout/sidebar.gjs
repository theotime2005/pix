import PixButtonLink from '@1024pix/pix-ui/components/pix-button-link';
import PixNavigation from '@1024pix/pix-ui/components/pix-navigation';
import PixNavigationButton from '@1024pix/pix-ui/components/pix-navigation-button';
import PixNavigationSeparator from '@1024pix/pix-ui/components/pix-navigation-separator';
import PixStructureSwitcher from '@1024pix/pix-ui/components/pix-structure-switcher';
import { action } from '@ember/object';
import { LinkTo } from '@ember/routing';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { t } from 'ember-intl';

const LINK_SCO = 'http://cloud.pix.fr/s/GqwW6dFDDrHezfS';
const LINK_OTHER = 'http://cloud.pix.fr/s/fLSG4mYCcX7GDRF';

export default class Sidebar extends Component {
  @service currentUser;
  @service router;

  get documentationLink() {
    if (this.currentUser.currentAllowedCertificationCenterAccess.isScoManagingStudents) {
      return LINK_SCO;
    }
    return LINK_OTHER;
  }

  get showLinkToSessions() {
    return !this.currentUser.currentAllowedCertificationCenterAccess.isAccessRestricted;
  }

  get userFullName() {
    const certificationPointOfContact = this.currentUser.certificationPointOfContact;
    return `${certificationPointOfContact.firstName} ${certificationPointOfContact.lastName}`;
  }

  get currentAllowedCertificationCenterAccess() {
    return this.currentUser.currentAllowedCertificationCenterAccess;
  }

  get certificationCenterNameAndExternalId() {
    if (this.currentAllowedCertificationCenterAccess.externalId) {
      return `${this.currentAllowedCertificationCenterAccess.name} (${this.currentAllowedCertificationCenterAccess.externalId})`;
    }
    return this.currentCertificationCenterName;
  }

  get currentCertificationCenterName() {
    return this.currentAllowedCertificationCenterAccess.name;
  }

  get eligibleCertificationCenterAccesses() {
    const allowedCertificationCenterAccesses =
      this.currentUser.certificationPointOfContact.allowedCertificationCenterAccesses;

    if (!allowedCertificationCenterAccesses) {
      return [];
    }
    return allowedCertificationCenterAccesses.sortBy('name').map(({ name, externalId, id }) => ({ label: externalId ? `${name} (${externalId})` : name, value: id }));
  }

  @action
  async changeCurrentCertificationCenterAccess(options) {
    this.currentUser.updateCurrentCertificationCenter(options.value);
    this.router.replaceWith('authenticated');
  }

  <template>
    <PixNavigation @navigationAriaLabel={{t 'navigation.sidebar.extra-information'}} @menuLabel="Menu">
      <:brand>
        <LinkTo @route='authenticated'>
          <img src='/certif.svg' alt={{t 'common.home-page'}} />
        </LinkTo>
      </:brand>
      <:navElements>
        <ul>
          {{#if this.showLinkToSessions}}
            <li>
              <PixNavigationButton
                @route='authenticated.sessions'
                @icon='session'
                aria-label={{t 'navigation.sidebar.sessions.extra-information'}}
              >
                {{t 'navigation.sidebar.sessions.label'}}
              </PixNavigationButton>
            </li>
            <li>
              <PixNavigationButton @route='login-session-supervisor' @icon='eye' target='_blank'>
                {{t 'navigation.sidebar.supervisor'}}
              </PixNavigationButton>
            </li>
          {{/if}}
          <li>
            <PixNavigationButton @route='authenticated.team' @icon='users' @plainIcon={{true}} @ariaHidden={{true}}>
              {{t 'navigation.sidebar.team'}}
            </PixNavigationButton>
          </li>
          <li>
            <PixNavigationButton
              href={{this.documentationLink}}
              @icon='book'
              @title='Documentation'
              @target='_blank'
              @newWindowLabel={{t 'navigation.external-link-title'}}
            >
              {{t 'navigation.sidebar.documentation'}}
            </PixNavigationButton>
          </li>
        </ul>
      </:navElements>
      <:footer>

        <span class='sidebar-footer__full-name'>{{this.userFullName}}</span>
        <span class='sidebar-footer__certification-center'>{{this.certificationCenterNameAndExternalId}}</span>

        <PixNavigationSeparator />

        {{#if this.eligibleCertificationCenterAccesses}}
          <PixStructureSwitcher
            @label={{t 'navigation.sidebar.change-center.label'}}
            @structures={{this.eligibleCertificationCenterAccesses}}
            @value={{this.currentUser.currentAllowedCertificationCenterAccess.id}}
            @onChange={{this.changeCurrentCertificationCenterAccess}}
          />
        {{/if}}

        <PixButtonLink @route='logout' @variant='tertiary'>
          {{t 'navigation.sidebar.log-out'}}
        </PixButtonLink>
      </:footer>
    </PixNavigation>
  </template>
}
