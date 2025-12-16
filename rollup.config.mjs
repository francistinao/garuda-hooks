import typescript from '@rollup/plugin-typescript'
import dts from 'rollup-plugin-dts'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const pkg = require('./package.json')

const input = 'src/index.ts'

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
]

export default [
  {
    input,
    external,
    output: [
      {
        file: 'dist/esm/index.js',
        format: 'esm',
        sourcemap: true,
      },
      {
        file: 'dist/cjs/index.cjs',
        format: 'cjs',
        sourcemap: true,
      },
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.rollup.json',
      })
      ,
    ],
  },

  {
    input: 'dist/types/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'es' }],
    plugins: [dts()],
    external,
  },
]
