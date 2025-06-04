import type { UploadConfig, } from '@higgins-mmt/core'
import type { Plugin, } from 'vite'
import type { I18nPluginOptions, } from './types'
import { generate, transform, upload, } from '@higgins-mmt/core'
import { createFilter, } from 'vite'

export default (options: I18nPluginOptions,): Plugin => {
  let isBuild = false
  return {
    name: 'i18n-transformer',
    configResolved(resolvedConfig,) {
      isBuild = resolvedConfig.command === 'build'
    },
    transform(code, id,) {
      const filter = createFilter(options.transformConfig.include, options.transformConfig.exclude,)
      const isOpened = options.open === true || (options.open === undefined && isBuild)
      if (!filter(id,) || !isOpened) {
        return {
          code,
          map: null,
        }
      }
      const {
        code: newCode,
        map,
      } = transform(
        {
          id,
          code,
        },
        options.transformConfig,
      )
      return {
        code: newCode,
        map,
      }
    },
    buildEnd() {
      if (!isBuild) {
        return
      }
      generate(options.generateConfig,)
    },
    writeBundle() {
      if (!isBuild || !options.uploadConfig) {
        return
      }
      if (!options.uploadConfig.appType) {
        options.uploadConfig.appType = 'FE_VUE3'
      }
      upload(options.uploadConfig as UploadConfig, options.generateConfig,)
    },
  }
}

export {
  ignoreAutoI18n,
} from '@higgins-mmt/core'
