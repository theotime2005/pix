import PixPagination from '@1024pix/pix-ui/components/pix-pagination';
import Cards from 'mon-pix/components/tutorials/cards';
import Header from 'mon-pix/components/tutorials/header';
import RecommendedEmpty from 'mon-pix/components/tutorials/recommended-empty';
import Sidebar from 'mon-pix/components/user-tutorials/filters/sidebar';
<template>
  <main id="main" class="user-tutorials global-page-container" role="main">
    <Header @onTriggerFilterButton={{@controller.showSidebar}} @shouldShowFilterButton={{true}} />
    <Sidebar
      @onSubmit={{@controller.handleSubmitFilters}}
      @isVisible={{@controller.isSidebarVisible}}
      @areas={{@controller.model.areas}}
      @onClose={{@controller.closeSidebar}}
    />
    <div class="user-tutorials-content global-page-container__streched-content">
      {{#if @model.recommendedTutorials.meta.pagination.rowCount}}
        <Cards @tutorials={{@model.recommendedTutorials}} />
        <PixPagination
          @pagination={{@model.recommendedTutorials.meta.pagination}}
          @pageOptions={{@controller.pageOptions}}
          @locale={{@controller.locale.currentLocale}}
          @isCondensed="true"
        />
      {{else}}
        <RecommendedEmpty />
      {{/if}}
    </div>
  </main>
</template>
