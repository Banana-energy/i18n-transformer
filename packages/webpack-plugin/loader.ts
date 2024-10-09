import {
  type Options, init, transform,
} from '@kapo/shared';
import { getOptions, } from './utils'
import type { LoaderContext, } from 'webpack';
import { createFilter, } from '@rollup/pluginutils';
import { ignoreAutoI18n, } from '@kapo/shared/common/utils'

export { ignoreAutoI18n, }

export default function loader(this: LoaderContext<Options>, code: string,) {
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
