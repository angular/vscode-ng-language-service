import * as fs from 'fs'
const banner = fs.readFileSync('server/banner.js', 'utf8')
export default {
  banner: {js: banner},
  // Workaround for https://github.com/aspect-build/rules_esbuild/issues/58
  resolveExtensions: ['.js'],
}
