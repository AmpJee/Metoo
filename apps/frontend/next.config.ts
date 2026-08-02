import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Emits a self-contained server bundle with only the node_modules it
  // actually uses — the Dockerfile copies .next/standalone rather than the
  // whole workspace, which is what keeps the image small.
  output: 'standalone',

  // The repo root, not apps/frontend: Bun's isolated linker puts the real
  // packages in the root node_modules/.bun store, and standalone tracing has
  // to follow those symlinks out of this directory.
  outputFileTracingRoot: new URL('../../', import.meta.url).pathname,

  images: {
    // Product photos and brand logos come from Supabase Storage.
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }],
  },
}

export default nextConfig
