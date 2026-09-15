// vite.config.js — the build. There is no bundler-specific code anywhere in
// src/; Vite is here to resolve the bare specifiers `three` and
// `three/addons/` that index.html used to resolve with an import map, and to
// hash and minify the result.
//
// THE RUNTIME GUARANTEE IS UNCHANGED. Nothing the page fetches leaves its own
// origin — no CDN, no font host, no asset host. What changed is where the
// three.js source comes from before the build runs: npm instead of a
// hand-copied libs/three.module.js. See CLAUDE.md and HISTORY.md #493.
import fs from 'node:fs';
import path from 'node:path';

// `assets/` and `data/` are fetched at runtime by URL, never imported, so Vite's
// graph never sees them. They are not under `public/` because seven suites and
// play-castle.mjs read them off disk at their repo-relative paths, and moving
// 43 MB to buy an idiom is not worth rewriting every one of those paths.
// `publicDir` is off for the same reason: there is no `public/`.
const STATIC_DIRS = ['assets', 'data'];

// KTX2Loader fetches these two by URL at first use, so they are not in the
// module graph and Vite will never emit them on its own (#506). They come out
// of the `three` package this repo pins rather than being copied into the repo
// by hand: a hand-copied decoder that nothing can tell you the provenance of is
// exactly what #494 deleted. Served under this origin at both ends — the build
// writes them into dist/decoders/basis/ and the dev server answers the same
// path from node_modules — because nothing this page fetches leaves its origin
// (#493) and test/built.mjs compares the two file sets.
const DECODER_DIR = 'decoders/basis';
const DECODER_SRC = 'node_modules/three/examples/jsm/libs/basis';
const DECODER_FILES = ['basis_transcoder.js', 'basis_transcoder.wasm'];

function decoders() {
  const from = (name) => path.resolve(import.meta.dirname, DECODER_SRC, name);
  return {
    name: 'castle-basis-transcoder',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const name = DECODER_FILES.find(f => req.url?.split('?')[0].endsWith(`${DECODER_DIR}/${f}`));
        if (!name) return next();
        res.setHeader('Content-Type', name.endsWith('.wasm') ? 'application/wasm' : 'text/javascript');
        fs.createReadStream(from(name)).pipe(res);
      });
    },
    closeBundle() {
      const out = this.environment?.config?.build?.outDir ?? 'dist';
      const to = path.resolve(import.meta.dirname, out, DECODER_DIR);
      fs.mkdirSync(to, { recursive: true });
      for (const name of DECODER_FILES) {
        // Throws rather than warns: a build that ships the page without the
        // transcoder is a build whose every texture 404s (#13).
        if (!fs.existsSync(from(name)))
          throw new Error(`build: ${DECODER_SRC}/${name} is not there — is three installed?`);
        fs.copyFileSync(from(name), path.join(to, name));
      }
    },
  };
}

function copyStatic() {
  return {
    name: 'castle-copy-static',
    apply: 'build',
    closeBundle() {
      const out = this.environment?.config?.build?.outDir ?? 'dist';
      for (const dir of STATIC_DIRS) {
        const from = path.resolve(import.meta.dirname, dir);
        const to = path.resolve(import.meta.dirname, out, dir);
        fs.cpSync(from, to, { recursive: true });
      }
      // A build that silently ships no models is the failure this catches. It
      // has to throw: a plugin that only logs is a check that gets ignored (#13).
      for (const dir of STATIC_DIRS) {
        const to = path.resolve(import.meta.dirname, out, dir);
        if (!fs.existsSync(to) || !fs.readdirSync(to).length)
          throw new Error(`build: ${dir}/ did not make it into ${out}/`);
      }
    },
  };
}

export default {
  base: './',
  publicDir: false,
  // Not the default 'spa'. The SPA fallback answers ANY miss with index.html at
  // status 200, including a missing .jpg, which is how a deliberately deleted
  // texture came back "served" and left test/built.mjs's file diff green on a
  // build that had dropped it (#501). There is one page here and no client-side
  // routing, so there is nothing to fall back for: a miss is a 404.
  appType: 'mpa',
  plugins: [copyStatic(), decoders()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Not the default 'assets'. `assets/` is the game's 40 MB of glTF and
    // textures, copied in whole by the plugin above; the hashed bundle gets its
    // own folder rather than being dropped in among the castle walls.
    assetsDir: 'bundle',
    // 40 MB of glTF and textures are copied in beside a ~700 KB bundle. The
    // default 500 KB warning would fire on three.js every single build.
    chunkSizeWarningLimit: 2000,
  },
  // Not prebundled, so `three` resolves to one stable dev URL —
  // /node_modules/three/build/three.module.js — which is what
  // test/drive.mjs's scene probe has to import to land on the same module
  // instance the game got. A prebundled copy lives at a hashed
  // /node_modules/.vite/deps/ URL that changes whenever the lockfile does.
  optimizeDeps: { exclude: ['three'] },
  server: { host: '127.0.0.1' },
};
