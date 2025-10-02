import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig(({ command, mode, isSsrBuild, isPreview }) => {
  if (command === 'serve') {
    return {
      base: './',
      plugins: [solidPlugin(), tailwindcss()],
      server: {
        port: 3000,
      },
      build: {
        outDir: 'dist',
        target: 'esnext',
        minify: false,
        sourcemap: true
      },
    };
  } else {
    // command === 'build'
    return {
      base: './',
      plugins: [solidPlugin(), tailwindcss()],
      server: {
        port: 3000,
      },
      build: {
        outDir: 'dist',
        target: 'esnext',
        minify: true,
        sourcemap: false
      },
    };
  }
});