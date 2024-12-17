import type { Compiler, } from 'webpack'
import {
  generate,
  type OutputSetting,
  upload,
  type UploadSetting,
} from '@kapo/shared'
import i18nTransformerLoader from './loader'
import { ignoreAutoI18n, } from './utils'

class I18nTransformerPlugin {
  outputConfig: OutputSetting
  uploadConfig?: UploadSetting

  constructor(outputConfig: OutputSetting, uploadConfig?: UploadSetting,) {
    this.outputConfig = outputConfig
    this.uploadConfig = uploadConfig
  }

  apply(compiler: Compiler,): void {
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
  I18nTransformerPlugin,
  ignoreAutoI18n,
}

export default i18nTransformerLoader
