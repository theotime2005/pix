import PixPagination from '@1024pix/pix-ui/components/pix-pagination';
import Cards from 'mon-pix/components/tutorials/cards';
import Header from 'mon-pix/components/tutorials/header';
import SavedEmpty from 'mon-pix/components/tutorials/saved-empty';
<template>
  <main id="main" class="user-tutorials global-page-container" role="main">
    <Header @onTriggerFilterButton={{@controller.showSidebar}} @shouldShowFilterButton={{false}} />
    <div class="user-tutorials-content global-page-container__streched-content">
      {{#if @model.savedTutorials.meta.pagination.rowCount}}
        <Cards @tutorials={{@model.savedTutorials}} @afterRemove={{@controller.refresh}} />
        <PixPagination
          @pagination={{@model.savedTutorials.meta.pagination}}
          @pageOptions={{@controller.pageOptions}}
          @locale={{@controller.locale.currentLocale}}
          @isCondensed="true"
        />
      {{else}}
        <SavedEmpty />
      {{/if}}
    </div>
  </main>
</template>
