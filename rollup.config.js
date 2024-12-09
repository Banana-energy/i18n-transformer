import typescript from 'rollup-plugin-ts'
import { babel, } from '@rollup/plugin-babel'

const commonOptions = {
  external: ['node:path', 'node:fs', 'crypto',],
  plugins: [
    typescript(),
    babel({
      extensions: ['.ts',],
    },),
  ],
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

export default packages
