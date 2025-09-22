/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds with ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds with type errors.
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // Fix for webpack 5 and Node.js modules in client-side code
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        path: false,
        os: false,
      };
    }

    // Handle ESM modules that might cause issues
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    };

    return config;
  },
  images: {
    domains: [
      'zejrhceuuujzgyukdwnb.supabase.co', // Supabase storage domain
      // Add other image domains as needed
    ],
  },
  env: {
    // Custom environment variables
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Redirect root to admin login (temporarily disabled for WordPress testing)
  // async redirects() {
  //   return [
  //     {
  //       source: '/',
  //       destination: '/admin',
  //       permanent: false,
  //     },
  //   ]
  // },

  // Handle favicon requests
  async rewrites() {
    return [
      {
        source: '/favicon.ico',
        destination: '/favicon.svg',
      },
    ]
  },


  // Force dynamic rendering for admin routes to prevent SSR issues
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },

  // WordPress widget build configuration
  experimental: {
    // Enable optimizations for widget builds
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog']
  },
}

module.exports = nextConfig
