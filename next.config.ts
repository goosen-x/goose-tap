import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    // Leaderboard: refresh every 2 minutes, stale for 5 minutes
    leaderboard: {
      stale: 60 * 5,      // 5 minutes - serve stale while revalidating
      revalidate: 60 * 2, // 2 minutes - check for updates
      expire: 60 * 10,    // 10 minutes - max age before forced refresh
    },
  },
};

export default nextConfig;
