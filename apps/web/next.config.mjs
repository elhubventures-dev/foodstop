import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Hoisted deps and workspace packages resolve from the monorepo root. */
const monorepoRoot = path.resolve(__dirname, "../..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: monorepoRoot,
  turbopack: {
    root: monorepoRoot,
  },
  // npm workspaces hoist deps to the repo root; webpack must resolve from there on Vercel.
  webpack: (config) => {
    const rootModules = path.join(monorepoRoot, "node_modules");
    config.resolve.modules = [
      rootModules,
      ...(Array.isArray(config.resolve.modules)
        ? config.resolve.modules
        : config.resolve.modules
          ? [config.resolve.modules]
          : []),
      "node_modules",
    ];
    return config;
  },
};

export default nextConfig;
