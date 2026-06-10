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
      // Localized homepages and the resources pages are SSR (prerender=false) so
      // the sitemap integration can't discover them automatically — list them explicitly.
      customPages: [
        'https://britzmedi.com/ko/',
        'https://britzmedi.com/ja/',
        'https://britzmedi.com/zh/',
        'https://britzmedi.com/th/',
        'https://britzmedi.com/vi/',
        'https://britzmedi.com/es/',
        'https://britzmedi.com/fr/',
        'https://britzmedi.com/ru/',
        'https://britzmedi.com/ar/',
        'https://britzmedi.com/resources/',
        'https://britzmedi.com/ko/resources/',
        'https://britzmedi.com/ja/resources/',
        'https://britzmedi.com/zh/resources/',
        'https://britzmedi.com/th/resources/',
        'https://britzmedi.com/vi/resources/',
        'https://britzmedi.com/es/resources/',
        'https://britzmedi.com/fr/resources/',
        'https://britzmedi.com/ru/resources/',
        'https://britzmedi.com/ar/resources/',
      ],
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en-US',
          ko: 'ko-KR',
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