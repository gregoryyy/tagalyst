import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import sourcemaps from 'rollup-plugin-sourcemaps';
import license from 'rollup-plugin-license';

export default [
  {
    // must be IIFE module (self-contained "immediately invoked function expression")
    input: 'src/content.js',
    output: { file: 'build/content.js', format: 'iife', name: 'TagalystContent', sourcemap: true },
    plugins: [
      resolve(), commonjs(), sourcemaps(), 
      license( {
        thirdParty: {
          output: 'build/licenses.txt'}
    })]
  },
  {
    // bundle background as dependency on logger etc.
    // must be ES module
    input: 'src/background.js',
    output: { file: 'build/background.js', format: 'es', sourcemap: true },
    plugins: [resolve(), sourcemaps()]
  },
  {
    // bundle popup as dependency on logger etc.
    // must be ES module
    input: 'src/popup.js',
    output: { file: 'build/popup/popup.js', format: 'es', sourcemap: true },
    plugins: [resolve(), sourcemaps()]
  }
];
