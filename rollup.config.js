import typescript from 'rollup-plugin-ts'

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
    external: ['path',],
    plugins: [typescript(),],
  },)
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
    external: ['path',],
    plugins: [typescript(),],
  },)
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
    plugins: [typescript(),],
    external: ['path',],
  },
],)
