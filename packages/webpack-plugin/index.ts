import type {OutputSetting,} from '@kapo/shared';
import {generate,} from '@kapo/shared';
import type {Compiler,} from 'webpack';
import i18nTransformerLoader from './loader'
import {ignoreAutoI18n,} from './utils'

class I18nTransformerPlugin {
  options: OutputSetting;

  constructor(options: OutputSetting,) {
    this.options = options
  }

  apply(compiler: Compiler,) {
    compiler.hooks.afterCompile.tap('I18nTransformerPlugin', () => {
      generate(this.options,)
    },)
  }
}

export {
  ignoreAutoI18n,
  I18nTransformerPlugin,
}

export default i18nTransformerLoader
