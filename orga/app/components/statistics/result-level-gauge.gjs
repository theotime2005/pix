import Component from '@glimmer/component';
import { t } from 'ember-intl';
export default class ResultLevelGauge extends Component {
  // avoir un logneur de bar par palier et non linéaire
  get maxLevelPercentage() {
    return `${Math.round((this.args.maxLevel / 8) * 100)}%`;
  }

  get meanLevelPercentage() {
    return `${Math.round((this.args.meanLevel / 8) * 100)}%`;
  }

  get labelKey() {
    return this.args.labelI18nKey ?? 'pages.analysis.gauge.label';
  }

  formatNumber = (str) => {
    const num = Number(str);
    const oneDigitNum = num.toFixed(1);
    if (oneDigitNum.toString().endsWith('0')) {
      return Math.ceil(oneDigitNum);
    }
    return oneDigitNum;
  };

  // todo : gerer la version mini (viewPort différent, élément cachés, formatNumber renvoi des entiers,  option pour hightlight )
  // todo : certif (option pouir cacher les label et dans ce cas utiliser labelI18nKey pour enoncer le niveau atteind(Indépendant / novice / ...))

  <template>
    <svg
      xmlns:svg="http://www.w3.org/2000/svg"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100% 40"
      version="1.1"
      preserveAspectRatio="none"
      class="result-level-gauge"
      aria-label={{t this.labelKey meanLevel=(this.formatNumber @meanLevel) maxLevel=(this.formatNumber @maxLevel)}}
      ...attributes
    >
      <title>{{t this.labelKey meanLevel=(this.formatNumber @meanLevel) maxLevel=(this.formatNumber @maxLevel)}}</title>
      {{! level labels }}
      <text x="12.5%" y="15" class="result-level-gauge__rank">{{t "pages.analysis.level.novice"}}</text>
      <text x="37.5%" y="15" class="result-level-gauge__rank">{{t "pages.analysis.level.independent"}}</text>
      <text x="62.5%" y="15" class="result-level-gauge__rank">{{t "pages.analysis.level.advanced"}}</text>
      <text x="87%" y="15" class="result-level-gauge__rank">{{t "pages.analysis.level.expert"}}</text>
      {{! gauge background }}
      <rect y="22" width="100%" height="48" rx="24" class="result-level-gauge__background" />

      <g transform="translate(4, 0)">
        {{! max level }}
        <rect y="26" width={{this.maxLevelPercentage}} height="40" rx="20" class="result-level-gauge__max-bar" />
        <text
          y="26"
          x={{this.maxLevelPercentage}}
          dx="-10"
          dy="26"
          class="result-level-gauge__max-value"
        >{{this.formatNumber @maxLevel}}</text>
        {{! mean level }}
        <rect y="26" width={{this.meanLevelPercentage}} height="40" rx="20" class="result-level-gauge__mean-bar" />
        <text
          y="26"
          x={{this.meanLevelPercentage}}
          dx="-10"
          dy="26"
          class="result-level-gauge__mean-value"
        >{{this.formatNumber @meanLevel}}</text>
        {{! separator lines }}
        <line
          x1="25%"
          y1="7"
          x2="25%"
          y2="74.6641"
          stroke-width="2"
          stroke-linecap="round"
          stroke-dasharray="2 8"
          class="result-level-gauge__separator"
        />
        <line
          x1="50%"
          y1="7"
          x2="50%"
          y2="74.6641"
          stroke-width="2"
          stroke-linecap="round"
          stroke-dasharray="2 8"
          class="result-level-gauge__separator"
        />
        <line
          x1="75%"
          y1="7"
          x2="75%"
          y2="74.6641"
          stroke-width="2"
          stroke-linecap="round"
          stroke-dasharray="2 8"
          class="result-level-gauge__separator"
        />
      </g>
    </svg>
  </template>
}
