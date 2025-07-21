import PixPagination from '@1024pix/pix-ui/components/pix-pagination';
import t from 'ember-intl/helpers/t';
import pageTitle from 'ember-page-title/helpers/page-title';
import Card from 'mon-pix/components/training/card';
import Header from 'mon-pix/components/training/header';
<template>
  {{pageTitle (t "pages.user-trainings.title")}}

  <main id="main" class="main" role="main">
    <Header />
    <div class="user-trainings-content">
      {{#if @model.trainings.meta.pagination.rowCount}}
        <div class="user-trainings-content__container">
          <ul class="user-trainings-content__list">
            {{#each @model.trainings as |training|}}
              <li class="user-trainings-content-list__item">
                <Card @training={{training}} />
              </li>
            {{/each}}
          </ul>
          <PixPagination
            @pagination={{@model.trainings.meta.pagination}}
            @pageOptions={{@controller.pageOptions}}
            @locale={{@controller.locale.currentLocale}}
            @isCondensed="true"
          />
        </div>
      {{/if}}
    </div>
  </main>
</template>
