process.env.ESBUILD_BINARY_PATH = require.resolve('esbuild-wasm/bin/esbuild');
const fs = require('fs');
const { build } = require('vite');
const path = require('path');

const OUT_DIR = '/tmp/iadist2';

// Clean and recreate output dir
if (fs.existsSync(OUT_DIR)) {
  fs.rmSync(OUT_DIR, { recursive: true });
}
fs.mkdirSync(OUT_DIR, { recursive: true });

build({
  configFile: false,
  root: '.',
  base: './',
  build: {
    outDir: OUT_DIR,
    target: 'esnext',
    rollupOptions: {
      input: {
        main: 'index.html',
        method: 'method.html',
        about: 'about.html',
        courses: 'courses.html',
        pricing: 'pricing.html',
        pricingScene: 'pricing-scene.js',
        pricingCardsScene: 'pricing-cards-scene.js',
        aboutScene: 'about-scene.js',
        scene: 'scene.js',
      },
    },
  },
  optimizeDeps: { exclude: ['stats-gl'] },
  esbuild: { supported: { 'top-level-await': true } },
}).then(() => {
  // Wait a tick for files to settle
  setTimeout(() => {
    // Copy to dist using fs methods
    const distDir = path.join(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      fs.rmSync(distDir, { recursive: true });
    }
    fs.mkdirSync(distDir, { recursive: true });
    
    // Copy all files from OUT_DIR to dist
    const files = fs.readdirSync(OUT_DIR);
    for (const file of files) {
      const srcPath = path.join(OUT_DIR, file);
      const destPath = path.join(distDir, file);
      const stat = fs.statSync(srcPath);
      if (stat.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        const subFiles = fs.readdirSync(srcPath);
        for (const subFile of subFiles) {
          fs.copyFileSync(path.join(srcPath, subFile), path.join(destPath, subFile));
        }
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
    
    console.log('\nCopied to dist/ successfully');
    console.log('dist files:', fs.readdirSync(distDir));
    console.log('dist HTML:', fs.readdirSync(distDir).filter(f => f.endsWith('.html')));
  }, 500);
}).catch(e => { console.error(e); process.exit(1); });
