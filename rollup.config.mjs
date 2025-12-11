import path from 'node:path'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import dts from 'rollup-plugin-dts'

const input = 'src/index.ts'
const external = ['react', 'react-dom', 'next']

const basePlugins = [
  resolve({ extensions: ['.js', '.ts', '.tsx'] }),
  commonjs(),
  typescript({ tsconfig: './tsconfig.build.json' })
]

export default [
  {
    input,
    external,
    output: [
      { file: 'dist/esm/index.js', format: 'esm', sourcemap: true },
      { file: 'dist/cjs/index.cjs', format: 'cjs', sourcemap: true }
    ],
    plugins: [...basePlugins, terser()]
  },
  {
    input,
    external,
    output: { file: 'dist/types/index.d.ts', format: 'esm' },
    plugins: [dts()]
  }
]