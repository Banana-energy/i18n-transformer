import typescript from 'rollup-plugin-ts'
import { babel, } from '@rollup/plugin-babel'

const commonOptions = ({
  external: ['path', 'fs', 'crypto',],
  plugins: [
    typescript(),
    babel({
      babelHelpers: 'bundled',
      extensions: ['.ts',],
    },),
  ],
})

const packageNames = ['shared', 'vite-plugin', 'webpack-plugin',];
const packages = packageNames.reduce((pkg, packageName,) => {
  pkg.push({
    input: `packages/${packageName}/index.ts`,
    output: [
      {
        file: `./packages/${packageName}/dist/index.cjs`,
        format: 'cjs',
        exports: 'named',
      },
      {
        file: `./packages/${packageName}/dist/index.js`,
        format: 'es',
        exports: 'named',
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
          exports: 'named',
        },
        {
          file: `./packages/${packageName}/dist/utils.js`,
          format: 'es',
          exports: 'named',
        },
      ],
      ...commonOptions,
    },)
  }
  return pkg
}, [],);

export default packages
