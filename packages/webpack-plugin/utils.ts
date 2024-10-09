import type { LoaderContext, } from 'webpack';
import type { Options, } from '@kapo/shared';

const specialValues: Record<string, any> = {
  null: null,
  true: true,
  false: false,
}

function parseQuery(query: string,) {
  if (!query.startsWith('?',)) {
    throw new Error(
      "A valid query string passed to parseQuery should begin with '?'",
    )
  }

  query = query.slice(1,);

  if (!query) {
    return {}
  }

  if (query.startsWith('{',) && query.endsWith('}',)) {
    return JSON.parse(query,)
  }

  const queryArgs = query.split(/[,&]/g,)
  const result = Object.create(null,)

  queryArgs.forEach((arg,) => {
    const idx = arg.indexOf('=',)

    if (idx >= 0) {
      let name = arg.slice(0, idx,)
      let value = decodeURIComponent(arg.slice(idx + 1,),)

      // eslint-disable-next-line no-prototype-builtins
      if (specialValues.hasOwnProperty(value,)) {
        value = (specialValues)[value]
      }

      if (name.endsWith('[]',)) {
        name = decodeURIComponent(name.substr(0, name.length - 2,),)

        if (!Array.isArray(result[name],)) {
          result[name] = []
        }

        result[name].push(value,)
      } else {
        name = decodeURIComponent(name,)
        result[name] = value
      }
    } else {
      const decodedArg = decodeURIComponent(arg,);
      if (arg.startsWith('-',)) {
        result[decodedArg.slice(1,)] = false;
      } else if (arg.startsWith('+',)) {
        result[decodedArg.slice(1,)] = true;
      } else {
        result[decodedArg] = true;
      }
    }
  },)

  return result
}

export function getOptions(loaderContext: LoaderContext<Options>,): Options {
  const query = loaderContext.query

  if (typeof query === 'string' && query !== '') {
    return parseQuery(query,)
  }

  if (!query || typeof query !== 'object') {
    // Not object-like queries are not supported.
    return {}
  }

  return query
}

export function ignoreAutoI18n<T, >(val: T,): T {
  return val
}
