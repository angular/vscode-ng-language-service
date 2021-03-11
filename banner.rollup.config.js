module.exports = [
  {
    input: 'dist/banner/banner.js',
    output: {
      file: 'dist/banner/banner.rollup.js',
      format: 'cjs',
    },
    external: [
      'path',
    ],
  },

];
