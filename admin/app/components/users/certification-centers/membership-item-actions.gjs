import PixButton from '@1024pix/pix-ui/components/pix-button';
import { t } from 'ember-intl';

<template>
  <div class="membership-item-actions">
    {{#if @isEditionMode}}
      <PixButton
        aria-label={{t "components.users.certification-centers.memberships.items.actions.save-extra-informations"}}
        class="member-item-actions__button"
        @size="small"
        @triggerAction={{@onSaveRoleButtonClicked}}
      >
        {{t "common.actions.save"}}
      </PixButton>

      <PixButton
        aria-label={{t "components.users.certification-centers.memberships.items.actions.cancel-extra-informations"}}
        @variant="secondary"
        class="member-item-actions__button"
        @size="small"
        @triggerAction={{@onCancelButtonClicked}}
      >
        {{t "common.actions.cancel"}}
      </PixButton>
    {{else}}
      <PixButton
        aria-label={{t "components.users.certification-centers.memberships.items.actions.edit-role-extra-informations"}}
        class="member-item-actions__button"
        @iconBefore="pen-to-square"
        @size="small"
        @triggerAction={{@onEditRoleButtonClicked}}
      >
        {{t "components.users.certification-centers.memberships.items.actions.edit-role"}}
      </PixButton>

      <PixButton
        aria-label={{t
          "components.users.certification-centers.memberships.items.actions.deactivate-extra-informations"
        }}
        @variant="error"
        class="member-item-actions__button"
        @iconBefore="trash"
        @size="small"
        @triggerAction={{@onDeactivateMembershipButtonClicked}}
      >
        {{t "common.actions.deactivate"}}
      </PixButton>
    {{/if}}
  </div>
</template>
