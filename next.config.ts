import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "500mb",
    },
  },
  /* Course thumbnails are signed GCS read URLs (~190 KB each); the optimizer
     resizes them to the size actually painted and caches the result. */
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  /* The paper texture is on every new-theme page. It used to be sent with
     max-age=0, so it was revalidated on every visit. */
  async headers() {
    return [
      {
        source: "/crumbled.jpg",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
