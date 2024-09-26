import transform from './transform/index.js'
import generate from './generate/index.js'
import {createFilter} from 'vite'
import collectInit from './common/collect.js'

export default function i18nAuto(options = {}) {
  const {setting} = collectInit(options)
  let isBuild = false
  return {
    name: 'auto-i18n',
    configResolved(resolvedConfig) {
      // 保存是否是构建过程
      isBuild = resolvedConfig.command === 'build'
    },
    transform(code, id) {
      const filter = createFilter(setting.include, setting.exclude)
      if (!filter(id)) {
        return {code}
      }
      const {code: newCode, map} = transform(
        {
          id,
          code
        },
        setting
      )
      return {
        code: newCode,
        map
      }
    },
    buildEnd() {
      if (!isBuild) {
        return
      }
      generate.call(this, setting)
    }
  }
}
