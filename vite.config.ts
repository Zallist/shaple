import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import legacy from '@vitejs/plugin-legacy';
import type { PluginOption } from 'vite';

function stripCrossorigin(): PluginOption {
  return {
    name: 'strip-crossorigin',
    enforce: 'post',
    transformIndexHtml(html: string) {
      return html.replace(/ crossorigin(\s*=\s*["'][^"']*["'])?/g, '');
    }
  };
}

export default defineConfig(({ command, mode, isSsrBuild, isPreview }) => {
  if (command === 'serve') {
    return {
      base: '',
      plugins: [
        solidPlugin(),
        tailwindcss(),
        legacy({
          targets: ['defaults', 'IE 11'],
          additionalLegacyPolyfills: ['regenerator-runtime/runtime']
        }),
        stripCrossorigin()
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
      base: '',
      plugins: [
        solidPlugin(),
        tailwindcss(),
        legacy({
          targets: ['defaults', 'IE 11'],
          additionalLegacyPolyfills: ['regenerator-runtime/runtime']
        }),
        stripCrossorigin()
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