process.env.ESBUILD_BINARY_PATH = require.resolve('esbuild-wasm/bin/esbuild');
const fs = require('fs');
const { build } = require('vite');

build({
  configFile: false,
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    target: 'esnext',
    rollupOptions: {
      input: {
        main: 'index.html',
        method: 'method.html',
        about: 'about.html',
        courses: 'courses.html',
        pricing: 'pricing.html',
        testimonials: 'testimonials.html',
        aboutPractice: 'about-practice-scene.js',
        aboutPhilosophy: 'about-philosophy-scene.js',
      },
    },
  },
  optimizeDeps: { exclude: ['stats-gl'] },
  esbuild: { supported: { 'top-level-await': true } },
}).then(() => {
  // Inject scene scripts into built about.html
  const aboutHtml = fs.readFileSync('dist/about.html', 'utf8');
  const practiceFile = fs.readdirSync('dist/assets').find(f => f.startsWith('aboutPractice'));
  const philosophyFile = fs.readdirSync('dist/assets').find(f => f.startsWith('aboutPhilosophy'));
  const aboutFile = fs.readdirSync('dist/assets').find(f => f.startsWith('about-') && !f.includes('Practice') && !f.includes('Philosophy'));
  
  const newHtml = aboutHtml.replace(
    `<script type="module" crossorigin src="./assets/${aboutFile}"></script>`,
    `<script type="module" crossorigin src="./assets/${aboutFile}"></script>\n  <script type="module" crossorigin src="./assets/${practiceFile}"></script>\n  <script type="module" crossorigin src="./assets/${philosophyFile}"></script>`
  );
  fs.writeFileSync('dist/about.html', newHtml);
  
  // Verify
  const verify = fs.readFileSync('dist/about.html', 'utf8');
  console.log('Has practice script:', verify.includes(practiceFile));
  console.log('Has philosophy script:', verify.includes(philosophyFile));
  console.log('Has TorusKnotGeometry in practice:', fs.readFileSync('dist/assets/' + practiceFile, 'utf8').includes('TorusKnotGeometry'));
  console.log('Has left:78%:', verify.includes('left: 78%'));
  console.log('Has top:46%:', verify.includes('top: 46%'));
  console.log('Has top:45%:', verify.includes('top: 45%'));
  console.log('Has width:480px:', verify.includes('width: 480px'));
  console.log('Has height:550px:', verify.includes('height: 550px'));
  console.log('Has no overflow:hidden on about-section:', !verify.match(/about-section\s*\{[^}]*overflow:\s*hidden/));
}).catch(e => { console.error(e); process.exit(1); });
