<template>
  <div class="certification-informations__published--float">
    <svg height="16" width="16" role="img" aria-labelledby="title">
      <title id="title">{{if @record.isPublished "Certification publiée" "Certification non publiée"}}</title>
      <circle
        cx="8"
        cy="8"
        r="7"
        stroke="#fff"
        stroke-width="1"
        fill={{if @record.isPublished "#39B97A" "#8090A5"}}
      ></circle>
    </svg>
  </div>
</template>
