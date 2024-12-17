import {
  type OutputSetting, type UploadSetting, generate, upload,
} from '@kapo/shared';
import type { Compiler, } from 'webpack';
import i18nTransformerLoader from './loader'
import { ignoreAutoI18n, } from './utils'

class I18nTransformerPlugin {
  outputConfig: OutputSetting;
  uploadConfig?: UploadSetting

  constructor(outputConfig: OutputSetting, uploadConfig?: UploadSetting,) {
    this.outputConfig = outputConfig
    this.uploadConfig = uploadConfig
  }

  apply(compiler: Compiler,) {
    compiler.hooks.afterCompile.tap('I18nTransformerPlugin', () => {
      generate(this.outputConfig,)
    },)
    compiler.hooks.afterEmit.tap('I18nTransformerPlugin', () => {
      if (this.uploadConfig) {
        upload(this.uploadConfig, this.outputConfig,)
      }
    },)
  }
}

export {
  ignoreAutoI18n,
  I18nTransformerPlugin,
}

export default i18nTransformerLoader
