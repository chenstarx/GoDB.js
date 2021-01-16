import path from 'path';
import pkg from './package.json';
import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import dts from 'rollup-plugin-dts';

const extensions = ['.ts', '.js'];

const config = [
  // es module, using original typescript compiler
  {
    input: './src/godb.ts',
    output: {
      name: 'Godb',
      format: 'es',
      file: path.resolve(pkg.main)
    },
    plugins: [
      resolve({ extensions }),
      typescript()
    ]
  },
  // .d.ts
  {
    input: './src/godb.ts',
    output: {
      name: 'Godb',
      format: 'es',
      file: path.resolve(pkg.typings)
    },
    plugins: [
      dts()
    ]
  },
  // .min.js, using babel for browser compatibility
  {
    input: './src/godb.ts',
    output: {
      name: 'Godb',
      format: 'umd',
      file: path.resolve(pkg.main.replace(/(.\w+)$/, '.min$1'))
    },
    plugins: [
      resolve({ extensions }),
      typescript(),
      babel({
        exclude: 'node_modules/**',
        babelHelpers: 'bundled'
      }),
      terser()
    ]
  }
];

export default config;
