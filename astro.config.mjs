import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://mletterio.github.io',
	base: '/',
	integrations: [sitemap()]
});
