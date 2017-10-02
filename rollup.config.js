import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import cleanup from 'rollup-plugin-cleanup'

export default {
  input: 'src/index.js',
  output: {
    extend: true,
    file: 'main.js',
    format: 'umd'
  },
  globals: {'leaflet': 'L'},
  plugins: [
    nodeResolve(),
    cleanup(),
    commonjs()
  ]
}
