const config = {
  swDest: 'public/sw.js',
  swSrc: 'src/sw/index.ts',
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*\/api\/.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'wedapp-api',
        expiration: { maxEntries: 50, maxAgeSeconds: 300 },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /^https?.*\/_next\/static\/.*$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'wedapp-static',
        expiration: { maxEntries: 200, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|png|gif|webp|svg|avif)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'wedapp-images',
        expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\.(?:woff|woff2|ttf|otf)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'wedapp-fonts',
        expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: ({ request }: { request: Request }) => request.mode === 'navigate',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'wedapp-pages',
        expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
        networkTimeoutSeconds: 5,
      },
    },
    {
      urlPattern: /\/manifest\.json$/,
      handler: 'CacheFirst',
      options: { cacheName: 'wedapp-static' },
    },
    {
      urlPattern: /^https?.*\.supabase\.co\/storage\/v1\/object\/public\/.*$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'wedapp-supabase-images',
        expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'wedapp-google-fonts',
        expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'wedapp-google-fonts',
        expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
  ],
};

export default config;