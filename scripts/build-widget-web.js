import { build } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';

build({
  entryPoints: [path.resolve(__dirname, '../src/web-component/element.ts')],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  outfile: path.resolve(__dirname, '../dist/heiwa-widget.web.js'),
  minify: isProduction,
  sourcemap: !isProduction,
  define: {
    'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
  },
  loader: {
    '.css': 'text',
    '.svg': 'dataurl',
    '.png': 'dataurl',
    '.jpg': 'dataurl',
  },
  target: ['chrome80', 'firefox75', 'safari13', 'edge80'],
  jsx: 'automatic',
  jsxImportSource: 'react',
  // Bundle size optimizations
  external: [],
  treeShaking: true,
  ignoreAnnotations: true,
  banner: {
    js: '// Heiwa Booking Widget Web Component v2.0.0',
  },
  // Performance optimizations
  legalComments: 'none',
  mangleProps: isProduction ? /^_[A-Za-z]/ : undefined,
  mangleQuoted: isProduction,
}).then(() => {
  console.log('✅ Built dist/heiwa-widget.web.js');
}).catch((error) => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});
