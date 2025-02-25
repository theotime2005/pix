import PixSelect from '@1024pix/pix-ui/components/pix-select';
import PixTable from '@1024pix/pix-ui/components/pix-table';
import PixTableColumn from '@1024pix/pix-ui/components/pix-table-column';
import PixIconButton from '@1024pix/pix-ui/components/pix-icon-button';
import PixButton from '@1024pix/pix-ui/components/pix-button';
import PixTooltip from '@1024pix/pix-ui/components/pix-tooltip';
import PixTag from '@1024pix/pix-ui/components/pix-tag';
import PixIcon from '@1024pix/pix-ui/components/pix-icon';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { t } from 'ember-intl';
import { fn } from '@ember/helper';
import Content from 'pix-certif/components/dropdown/content';
import Item from 'pix-certif/components/dropdown/item';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { notEq, or } from 'ember-truth-helpers';

const ARIA_LABEL_MEMBER_TRANSLATION = 'pages.team.members.actions.select-role.options.member';
const ARIA_LABEL_ADMIN_TRANSLATION = 'pages.team.members.actions.select-role.options.admin';

export default class MembersTable extends Component {
  @service currentUser;
  @service pixToast;
  @service intl;

  roleOptions = [
    {
      value: 'ADMIN',
      label: this.intl.t(ARIA_LABEL_ADMIN_TRANSLATION),
      disabled: false,
    },
    {
      value: 'MEMBER',
      label: this.intl.t(ARIA_LABEL_MEMBER_TRANSLATION),
      disabled: false,
    },
  ];

  displayRoleByOrganizationRole = {
    ADMIN: this.intl.t(ARIA_LABEL_ADMIN_TRANSLATION),
    MEMBER: this.intl.t(ARIA_LABEL_MEMBER_TRANSLATION),
  };

  get isMultipleAdminsAvailable() {
    const adminMembers = this.args.members?.filter((member) => member.isAdmin);
    return adminMembers.length > 1;
  }

  get members() {
    const tutu =  this.args.members.map((member) => {return {firstName: member.firstName, lastName: member.lastName, isDisplayToggled: false}});
    console.log(tutu)
    return tutu;
  }

  @action
  toggleMenu(member) {
    member.isDisplayToggled = !member.isDisplayToggled;
    console.log(member);
  }

  @action
  closeMenu() {
    this.isMenuOpen = false;
  }

  get shouldDisplayManagingColumn() {
    return this.currentUser.isAdminOfCurrentCertificationCenter && this.args.members.length > 1;
  }

  @action
  setRoleSelection(value) {
    this.args.member.role = value;
  }

  @action
  toggleEditionMode() {
    this.isEditionMode = true;
  }

  @action
  async updateMember(member) {
    this.isEditionMode = false;
    try {
      await member.save();
      this.pixToast.sendSuccessNotification({
        message: this.intl.t('pages.team.members.notifications.change-member-role.success'),
      });
    } catch (e) {
      member.rollbackAttributes();
      this.pixToast.sendErrorNotification({
        message: this.intl.t('pages.team.members.notifications.change-member-role.error'),
      });
    }
  }

  @action
  cancelUpdateRoleOfMember() {
    this.isEditionMode = false;
    this.closeMenu();
    this.args.member.rollbackAttributes();
  }



  <template>
    <PixTable @data={{this.members}} @variant="certif">
      <:columns as |member context index|>
        <PixTableColumn @context={{context}}>
          <:header>
            {{t "common.labels.candidate.lastname"}}
          </:header>
          <:cell>
            {{member.lastName}}
          </:cell>
        </PixTableColumn>
        <PixTableColumn @context={{context}}>
          <:header>
            {{t "common.labels.candidate.firstname"}}
          </:header>
          <:cell>
            {{member.firstName}}
          </:cell>
        </PixTableColumn>
        <PixTableColumn @context={{context}}>
          <:header>
            {{index}}
            {{t "common.labels.candidate.role"}}
          </:header>
          <:cell>
            {{index}}
            {{#if this.isEditionMode}}
              <PixSelect
                @screenReaderOnly={{true}}
                @hideDefaultOption={{true}}
                @placeholder="{{t 'pages.team.members.actions.select-role.label'}}"
                @onChange={{this.setRoleSelection}}
                @options={{this.roleOptions}}
                @value={{member.role}}
              >
                <:label>{{t "pages.team.members.actions.select-role.label"}}</:label>
              </PixSelect>
            {{else}}
              {{member.roleLabel}}
            {{/if}}
          </:cell>
        </PixTableColumn>
        {{#if this.shouldDisplayManagingColumn}}
          <PixTableColumn @context={{context}}>
            <:header>
              {{t "pages.team.table-headers.actions"}}
            </:header>
            <:cell>
              {{#if this.isEditionMode}}
                <div class="members-list-item__managing-role">
                  <PixButton
                    id="save-certification-center-role"
                    @triggerAction={{fn this.updateMember member}}
                    @size="small"
                    aria-label={{t "pages.team.members.actions.save"}}
                  >
                    {{t "pages.team.members.actions.save"}}
                  </PixButton>
                  <PixIconButton
                    @iconName="close"
                    id="cancel-update-certification-center-role"
                    @ariaLabel="{{t 'common.actions.cancel'}}"
                    @triggerAction={{this.cancelUpdateRoleOfMember}}
                    @withBackground={{false}}
                  />
                </div>
              {{else}}
                  <PixIconButton
                    @withBackground={{false}}
                    @size="small"
                    @iconName="moreVert"
                    @ariaLabel={{t "pages.team.members.actions.manage"}}
                    @triggerAction={{this.toggleMenu member}}
                  />
                <Content
                  @display={{member.isDisplayToggled}}
                  @close={{this.closeMenu}}
                  aria-label={{t "pages.session-supervising.candidate-in-list.candidate-options"}}
                >
                    <Item @onClick={{this.toggleEditionMode}}>
                      {{t "pages.team.members.actions.edit-role"}}
                    </Item>
                    <Item @onClick={{fn @onRemoveMemberButtonClicked member}}>
                      {{t "pages.team.members.actions.remove-membership"}}
                    </Item>
                    {{#if this.shouldDisplayLeaveCertificationCenterOption}}
                      <Item @onClick={{@onLeaveCertificationCenterButtonClicked}}>
                        {{t "pages.team.members.actions.leave-certification-center"}}
                      </Item>
                    {{/if}}
                  </Content>
                {{/if}}
            </:cell>
          </PixTableColumn>
        {{/if}}
        {{#if this.shouldDisplayRefererColumn}}
          <PixTableColumn @context={{context}}>
            <:header>
              {{t "pages.team.referer"}}
            </:header>
            <:cell>
              {{#if member.isReferer}}
                <div class="members-list-item__container">
                  <PixTag class="members-list-item__tag" @color="primary">
                    {{t "pages.team.pix-referer"}}
                  </PixTag>
                  <PixTooltip class="members-list-item__tooltip" @isWide="true" @position="left">
                    <:triggerElement>
                      <span tabindex="0">
                        <PixIcon
                          @name="info"
                          @plainIcon={{true}}
                          @ariaHidden={{true}}
                          class="members-list-item__tooltip-icon"
                        />
                      </span>
                    </:triggerElement>
                    <:tooltip>
                      {{t "pages.team.pix-referer-tooltip"}}
                    </:tooltip>
                  </PixTooltip>
                </div>
              {{/if}}
            </:cell>
          </PixTableColumn>
        {{/if}}
      </:columns>
    </PixTable>
  </template>
}
