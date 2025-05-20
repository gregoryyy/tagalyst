// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'src/content.js',
  output: {
    file: 'build/content.js',
    format: 'iife',
    name: 'TagalystContent'
  },
  plugins: [resolve()]
};
