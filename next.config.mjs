/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip ESLint during production builds (run separately in CI)
  eslint: { ignoreDuringBuilds: true },
  // Skip TypeScript type-checking during builds (already checked in dev)
  typescript: { ignoreBuildErrors: true },
  // Allow dev server access from phones/tablets on local network
  allowedDevOrigins: ["192.168.86.*", "192.168.*.*", "10.*.*.*", "172.16.*.*"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "spoonacular.com" },
      { protocol: "https", hostname: "img.spoonacular.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.unsplash.com" },
      { protocol: "https", hostname: "source.unsplash.com" },
    ],
  },
};

export default nextConfig;
