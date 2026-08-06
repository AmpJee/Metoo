import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Emits a self-contained server bundle with only the node_modules it
  // actually uses — the Dockerfile copies .next/standalone rather than the
  // whole workspace, which is what keeps the image small.
  output: 'standalone',

  // The repo root, not apps/frontend: Bun's isolated linker puts the real
  // packages in the root node_modules/.bun store, and standalone tracing has
  // to follow those symlinks out of this directory.
  //
  // fileURLToPath, not .pathname: a URL percent-encodes, so any space in the
  // checkout path came back as "%20" and pointed at a directory that does not
  // exist. Turbopack then failed to place distDir under it and panicked with
  // "Invalid distDirRoot" — the build did not work on any machine whose path
  // has a space in it.
  outputFileTracingRoot: fileURLToPath(new URL('../../', import.meta.url)),

  images: {
    // Product photos and brand logos come from Supabase Storage.
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }],
  },
}

export default nextConfig
