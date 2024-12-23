import type { Compiler, } from 'webpack'
import * as process from 'process'
import {
  generate,
  type OutputSetting,
  upload,
  type UploadSetting,
} from '@kapo/shared'
import { AppTypeEnum, } from '@kapo/shared/generate'
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
    const isWatchMode =
      process.argv.includes('--watch',) ||
      process.argv.includes('-w',) ||
      process.argv.includes('serve',)

    compiler.hooks.afterCompile.tap('I18nTransformerPlugin', () => {
      generate(this.outputConfig,)
    },)

    compiler.hooks.afterEmit.tap('I18nTransformerPlugin', () => {
      if (isWatchMode) {
        return
      }
      if (this.uploadConfig) {
        if (!this.uploadConfig.appType) {
          this.uploadConfig.appType = AppTypeEnum.VUE2
        }
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
