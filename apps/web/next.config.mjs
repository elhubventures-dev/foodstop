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
    config.resolve.modules.push(path.resolve(monorepoRoot, "node_modules"));
    return config;
  },
};

export default nextConfig;
