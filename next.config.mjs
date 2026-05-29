/**
 * Static export config for GitHub Pages.
 *
 * When the GITHUB_PAGES env var is set (in the deploy workflow), the build
 * uses the repository name as the base path so assets resolve under
 * https://<user>.github.io/Catalyst/. Local `next dev` ignores it.
 */
const isPages = process.env.GITHUB_PAGES === "true";
const basePath = isPages ? "/Catalyst" : "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
