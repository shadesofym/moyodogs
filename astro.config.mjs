import { defineConfig } from 'astro/config';
import seo from './src/data/seo.json' with {type:'json'};
export default defineConfig({
  site: seo.origin,
  output: 'static',
  vite: { build: { assetsInlineLimit: 0 } },
  trailingSlash: 'always',
  markdown: { shikiConfig: { theme: 'github-dark' } },
});
