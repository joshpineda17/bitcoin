import { defineConfig } from 'astro/config';
import { rehypeGate } from './src/lib/rehype-gate.mjs';

export default defineConfig({
  site: 'https://cacaomedia.sv',
  trailingSlash: 'always',
  markdown: {
    rehypePlugins: [rehypeGate],
  },
});
