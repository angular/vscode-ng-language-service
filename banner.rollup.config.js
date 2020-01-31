module.exports = [
  {
    input: 'server/out/banner/banner.js',
    output: {
      file: 'server/out/banner/banner.rollup.js',
      format: 'cjs',
    },
    external: [
      'path',
    ],
  },

];
