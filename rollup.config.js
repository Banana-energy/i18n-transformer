import typescript from 'rollup-plugin-ts'

const packageNames = ['shared', 'vite-plugin', 'webpack-plugin',];
const packages = packageNames.map((packageName,) => ({
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
}),);

export default packages
