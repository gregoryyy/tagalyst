import resolve from '@rollup/plugin-node-resolve';

export default [
  {
    // must be IIFE module (self-contained "immediately invoked function expression")
    input: 'src/content.js',
    output: { file: 'build/content.js', format: 'iife', name: 'TagalystContent' },
    plugins: [resolve()]
  },
  {
    // bundle background as dependency on logger etc.
    // must be ES module
    input: 'src/background.js',
    output: { file: 'build/background.js', format: 'es' },
    plugins: [resolve()]
  }
];
