import {
  type Plugin, createFilter,
} from 'vite'
import {
  type Options, generate, init, transform,
} from '@kapo/shared'

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
        }
      }
      const {
        code: newCode, map,
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
  }
}
