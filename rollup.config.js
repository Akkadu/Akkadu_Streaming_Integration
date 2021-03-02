import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import builtins from 'rollup-plugin-node-builtins'

export default {
  input: './src/index.js',
  cache:false,
  output: {
    dir: './dist/',
    format: 'esm',
    name: 'bundle'
  },
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: true
    }),
    commonjs({
      include: ["node_modules/**"],
    }),
    builtins(),
  ],
  external: [
  ],
}
