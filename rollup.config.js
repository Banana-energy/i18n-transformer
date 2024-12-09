import typescript from 'rollup-plugin-ts'
import { babel, } from '@rollup/plugin-babel'

const commonOptions = {
  external: ['path',],
  plugins: [typescript(), babel({
    extensions: ['.ts',],
  },),],
}

const packageNames = ['shared', 'vite-plugin', 'webpack-plugin',];
const packages = packageNames.reduce((pkg, packageName,) => {
  pkg.push({
    input: `packages/${packageName}/index.ts`,
    output: [
      {
        file: `./packages/${packageName}/dist/index.cjs`,
        format: 'cjs',
      },
      {
        file: `./packages/${packageName}/dist/index.js`,
        format: 'es',
      },
    ],
    ...commonOptions,
  },)
  if (packageName !== 'shared') {
    pkg.push({
      input: `packages/${packageName}/utils.ts`,
      output: [
        {
          file: `./packages/${packageName}/dist/utils.cjs`,
          format: 'cjs',
        },
        {
          file: `./packages/${packageName}/dist/utils.js`,
          format: 'es',
        },
      ],
      ...commonOptions,
    },)
  }
  return pkg
}, [],);

export default packages.concat([
  {
    input: 'packages/webpack-plugin/loader.ts',
    output: [
      {
        file: 'packages/webpack-plugin/dist/loader.js',
        format: 'es',
      },
      {
        file: 'packages/webpack-plugin/dist/loader.cjs',
        format: 'cjs',
      },
    ],
    ...commonOptions,
  },
],)
