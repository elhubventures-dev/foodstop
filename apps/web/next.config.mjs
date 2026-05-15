import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Hoisted deps and workspace packages resolve from the monorepo root. */
const monorepoRoot = path.join(__dirname, "../..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for npm workspaces on Vercel (must match Vercel's tracing root).
  outputFileTracingRoot: monorepoRoot,
};

// Local dev only: avoid Turbopack root conflicting with outputFileTracingRoot on Vercel builds.
if (process.env.NODE_ENV === "development" && !process.env.VERCEL) {
  nextConfig.turbopack = { root: monorepoRoot };
}

export default nextConfig;
