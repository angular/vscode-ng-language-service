module.exports = [
  {
    input: 'server/out/banner/banner.js',
    output: {
      file: 'dist/server/banner.js',
      format: 'cjs',
    },
    external: [
      'path',
    ],
  },

];
