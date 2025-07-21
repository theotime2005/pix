import PixSelect from '@1024pix/pix-ui/components/pix-select';
import { action } from '@ember/object';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import t from 'ember-intl/helpers/t';

export default class LanguageSwitcher extends Component {
  @service locale;

  get selectedLanguage() {
    return this.args.selectedLanguage;
  }

  @action
  onChange(value) {
    this.args.onLanguageChange(value);
  }

  get availableLanguages() {
    return this.locale.availableLanguagesForSwitcher;
  }

  <template>
    <PixSelect
      ...attributes
      class="language-switcher"
      @id="language-switcher"
      @iconName="globe"
      @value={{this.selectedLanguage}}
      @options={{this.availableLanguages}}
      @onChange={{this.onChange}}
      @hideDefaultOption="true"
      @screenReaderOnly="true"
    >
      <:label>{{t "pages.inscription.choose-language-aria-label"}}</:label>
    </PixSelect>
  </template>
}
