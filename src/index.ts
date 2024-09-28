import transform from './transform/index'
import generate from './generate/index'
import {
  createFilter, Plugin,
} from 'vite'
import collectInit, { Options, } from './common/collect'

export default (options: Options = {},): Plugin => {
  const { setting, } = collectInit(options,)
  let isBuild = false
  return {
    name: 'auto-i18n',
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
      generate.call(this, setting.output,)
    },
  }
}
