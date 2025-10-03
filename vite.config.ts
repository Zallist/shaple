import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig(({ command, mode, isSsrBuild, isPreview }) => {
  if (command === 'serve') {
    return {
      base: './',
      plugins: [
        solidPlugin(),
        tailwindcss(),
        legacy({
          targets: ['defaults', 'IE 11'],
          additionalLegacyPolyfills: ['regenerator-runtime/runtime']
        })
      ],
      server: {
        port: 3000,
      },
      build: {
        outDir: 'dist',
        target: 'es2015',
        minify: false,
        sourcemap: true
      },
    };
  } else {
    // command === 'build'
    return {
      base: './',
      plugins: [
        solidPlugin(),
        tailwindcss(),
        legacy({
          targets: ['defaults', 'IE 11'],
          additionalLegacyPolyfills: ['regenerator-runtime/runtime']
        })
      ],
      server: {
        port: 3000,
      },
      build: {
        outDir: 'dist',
        target: 'es2015',
        minify: true,
        sourcemap: false
      },
    };
  }
});