import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import legacy from '@vitejs/plugin-legacy';
import tailwindLegacy from './vite-plugin-tailwind-legacy';
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
  const isBuild = command === 'build';

  return {
    base: '',
    plugins: [
      solidPlugin(),
      tailwindcss(),
      tailwindLegacy({
        tailwindConfig: 'tailwind.config.legacy.js',
        assetsDir: 'dist/assets',
        publicPath: 'assets/',
        inputCSS: 'tailwind.legacy.css',
        injectInHTML: true,
      }),
      legacy({
        targets: ['fully supports es5'],
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
      minify: isBuild,
      sourcemap: !isBuild
    },
  };
});