// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://britzmedi.com',

  integrations: [
    react(),
    markdoc(),
    keystatic(),
    sitemap({
      filter: (page) => !page.includes('/keystatic'),
      // Localized homepages are SSR (prerender=false) so the sitemap integration
      // can't discover them automatically — list them explicitly.
      customPages: [
        'https://britzmedi.com/ja/',
        'https://britzmedi.com/zh/',
        'https://britzmedi.com/th/',
        'https://britzmedi.com/vi/',
        'https://britzmedi.com/es/',
        'https://britzmedi.com/fr/',
        'https://britzmedi.com/ru/',
        'https://britzmedi.com/ar/',
      ],
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en-US',
          ja: 'ja-JP',
          zh: 'zh-CN',
          th: 'th-TH',
          vi: 'vi-VN',
          es: 'es-ES',
          fr: 'fr-FR',
          ru: 'ru-RU',
          ar: 'ar-SA',
        },
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ['lucide-react'],
    },
  },

  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },

  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
    routes: {
      extend: {
        exclude: [
          { pattern: '/sitemap-index.xml' },
          { pattern: '/sitemap-0.xml' },
        ],
      },
    },
  }),
});