import path from 'node:path'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import { terser } from '@rollup/plugin-terser'
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
      { dir: 'dist/esm', format: 'esm', sourcemap: true, preserveModules: true },
      { dir: 'dist/cjs', format: 'cjs', sourcemap: true, preserveModules: true, entryFileNames: '[name].cjs' }
    ],
    plugins: [...basePlugins, terser()]
  },
  {
    input,
    external,
    output: { dir: 'dist/types', format: 'esm' },
    plugins: [dts()]
  }
]