import type { RollupOptions, } from 'rollup'
import { babel, } from '@rollup/plugin-babel'
import typescript from '@rollup/plugin-typescript'

const config: RollupOptions = {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'es',
      sourcemap: true,
    },
    {
      file: 'dist/index.cjs',
      format: 'cjs',
      sourcemap: true,
    },
  ],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: './dist',
    },),
    babel({
      babelHelpers: 'bundled',
      extensions: [ '.ts', ],
      plugins: [
        '@babel/plugin-transform-nullish-coalescing-operator',
        '@babel/plugin-transform-optional-chaining',
      ],
      targets: {
        node: '14',
      },
      presets: [
        '@babel/preset-env',
        '@babel/preset-typescript',
      ],
    },),
  ],
}

export default config
