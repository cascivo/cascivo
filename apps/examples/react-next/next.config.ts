import type { NextConfig } from 'next'

// No special config needed: @cascivo/react ships prebuilt ESM with 'use client'
// preserved, and Next resolves its CSS exports ('@cascivo/react/styles.css',
// '@cascivo/themes/all.css') as global CSS when imported from the root layout.
const nextConfig: NextConfig = {}

export default nextConfig
