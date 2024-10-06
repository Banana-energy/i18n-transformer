import type { OutputSetting, } from '@kapo/shared';
import { generate, } from '@kapo/shared';
import type { Compiler, } from 'webpack';

export class I18nTransformerPlugin {
  options: OutputSetting;

  constructor(options: OutputSetting,) {
    this.options = options
  }

  apply(compiler: Compiler,) {
    compiler.hooks.emit.tap('I18nTransformerPlugin', () => {
      generate(this.options,)
    },)
  }
}
