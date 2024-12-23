import {
  generate,
  init,
  type Options,
  transform,
  upload,
} from '@kapo/shared'
import { AppTypeEnum, } from '@kapo/shared/generate'
import { createFilter, type Plugin, } from 'vite'
import { ignoreAutoI18n, } from './utils'

export default (options: Options = {},): Plugin => {
  const { setting, } = init(options,)
  let isBuild = false
  return {
    name: 'i18n-transformer',
    configResolved(resolvedConfig,) {
      // 保存是否是构建过程
      isBuild = resolvedConfig.command === 'build'
    },
    transform(code, id,) {
      const filter = createFilter(setting.include, setting.exclude,)
      if (!filter(id,)) {
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
        setting,
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
      generate(setting.output,)
    },
    writeBundle() {
      if (!isBuild || !setting.upload) {
        return
      }
      if (!setting.upload.appType) {
        setting.upload.appType = AppTypeEnum.VUE3
      }
      upload(setting.upload, setting.output,)
    },
  }
}

export {
  ignoreAutoI18n,
}
