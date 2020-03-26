import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import builtins from 'rollup-plugin-node-builtins'

export default {
  input: './src/index.js',
  output: {
    dir: './dist/',
    format: 'esm',
    name: 'bundle'
  },
  plugins: [
    resolve({
      main:true
    }),
    commonjs(),
    builtins()
  ],
  external: [
  ],
}
