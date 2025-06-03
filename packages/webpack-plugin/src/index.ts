import type { GenerateConfig, UploadConfig, } from '@higgins-mmt/core'
import type { Compiler, } from 'webpack'
import process from 'process'
import {
  generate,
  upload,
} from '@higgins-mmt/core'
import i18nTransformerLoader from './loader'

type UploadOptions = UploadConfig & {
  appType?: 'FE_VUE2' | 'FE_VUE3'
}

export class I18nTransformPlugin {
  generateConfig: GenerateConfig
  uploadConfig: UploadOptions

  constructor(generateConfig: GenerateConfig, uploadConfig: UploadOptions,) {
    this.generateConfig = generateConfig
    this.uploadConfig = uploadConfig
  }

  apply(compiler: Compiler,) {
    const isWatchMode =
      process.argv.includes('--watch',) ||
      process.argv.includes('-w',) ||
      process.argv.includes('serve',)

    compiler.hooks.afterCompile.tap('I18nTransformerPlugin', () => {
      if (isWatchMode) {
        return
      }
      generate(this.generateConfig,)
    },)

    compiler.hooks.afterEmit.tap('I18nTransformerPlugin', () => {
      if (isWatchMode || !this.uploadConfig) {
        return
      }
      if (!this.uploadConfig.appType) {
        this.uploadConfig.appType = 'FE_VUE2'
      }
      upload(this.uploadConfig, this.generateConfig,)
    },)
  }
}

export default i18nTransformerLoader
