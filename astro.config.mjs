import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import { rehypeGate } from './src/lib/rehype-gate.mjs';

export default defineConfig({
  site: 'https://cacaomedia.sv',
  trailingSlash: 'always',
  markdown: {
    processor: unified({ rehypePlugins: [rehypeGate] }),
  },
});
