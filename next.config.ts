import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "@prisma/adapter-pg",
    "pg",
    "socket.io",
    "@socket.io/redis-adapter",
    "ioredis",
  ],
};

export default nextConfig;
