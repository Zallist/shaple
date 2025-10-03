import { Plugin } from 'vite';

interface TailwindLegacyOptions {
  tailwindConfig?: string;
  inputCSS?: string;
  assetsDir?: string;
  publicPath?: string;
  buildDir?: string;
  injectInHTML?: boolean;
}

declare const TailwindLegacyPlugin: (options?: TailwindLegacyOptions) => Plugin;
export default TailwindLegacyPlugin;