import type { LoaderContext, } from 'webpack'
import { init, type Options, transform, } from '@higgins-mmt/shared'
import { createFilter, } from '@rollup/pluginutils'
import { getOptions, } from './utils'

export default function i18nTransformerLoader(this: LoaderContext<Options>, code: string,): string {
  const { resourcePath, } = this
  const { setting: options, } = init(getOptions(this,) || {},)
  const {
    include = [],
    exclude = [],
  } = options || {}
  if (!createFilter(include, exclude,)(resourcePath,)) {
    return code
  }
  const { code: newCode, } = transform({
    id: resourcePath,
    code,
  }, options,)

  return newCode
}
