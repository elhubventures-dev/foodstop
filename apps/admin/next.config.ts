import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@chopfast/shared", "@chopfast/ui"],
  turbopack: {
    // Workspace packages (source in repo)
    resolveAlias: {
      "@chopfast/shared": "../../packages/shared",
      "@chopfast/ui": "../../packages/ui",
      // Hoisted to repo root - Turbopack dev often skips parent node_modules on Windows;
      // pin these so client chunks can resolve (see lucide-react runtime error).
      "lucide-react": "../../node_modules/lucide-react",
      "framer-motion": "../../node_modules/framer-motion",
      "socket.io-client": "../../node_modules/socket.io-client",
      "@supabase/supabase-js": "../../node_modules/@supabase/supabase-js",
    },
  },
};

export default nextConfig;
