import {
  type GlobalSetting, type Options, init,
} from '@karpo/shared';
import type { Compiler, } from 'webpack';

class i18nTransformerPlugin {
  setting: GlobalSetting;
  isBuild?: boolean

  constructor(options: Options,) {
    const { setting, } = init(options,);
    this.setting = setting
  }

  apply(compiler: Compiler,) {
    compiler.hooks.compilation.tap('i18nTransformerPlugin', () => {
      this.isBuild = process.argv.includes('build',) // 检查是否是构建
    },)
    compiler.hooks.emit.tap('i18nTransformerPlugin', (compilation,) => {
      console.log(compilation.getAssets(),);
    },)
  }
}

export default i18nTransformerPlugin
