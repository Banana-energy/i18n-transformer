import typescript from 'rollup-plugin-ts'

const config = {
  input: 'src/index.ts',
  output: [
    {
      file: './dist/index.cjs',
      format: 'cjs',
    },
    {
      file: './dist/index.js',
      format: 'es',
    },
  ],
  external: [
    'path',
  ],
  plugins: [typescript(),],
}

export default config
