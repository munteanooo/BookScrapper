/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { hostname: "*.librarius.md" },
      { hostname: "*.carturesti.md" },
      { hostname: "*.litera.md" },
      { hostname: "*.biblion.md" },
    ],
  },
}

export default nextConfig
