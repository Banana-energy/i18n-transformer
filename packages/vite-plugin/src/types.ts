import type { GenerateConfig, TransformConfig, UploadConfig, } from '@higgins-mmt/core'

type UploadOptions = Omit<UploadConfig, 'appType'> & {
  appType?: 'FE_VUE2' | 'FE_VUE3'
}

export interface I18nPluginOptions {
  transformConfig: TransformConfig
  uploadConfig: UploadOptions
  generateConfig: GenerateConfig
  open?: boolean
}
