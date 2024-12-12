import PixNotificationAlert from '@1024pix/pix-ui/components/pix-notification-alert';
import { t } from 'ember-intl';
import { gt } from 'ember-truth-helpers';

<template>
  {{#if (gt @occupied @total)}}
    <PixNotificationAlert class="capacity-alert" @type="error" @withIcon={{true}}>
      {{t "banners.over-capacity.message"}}
    </PixNotificationAlert>
  {{/if}}
</template>
