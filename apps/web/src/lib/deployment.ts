/**
 * True only on the production deployment on Vercel. Previews and local builds are not, so they are never
 * indexed. Read at build time (`VERCEL_ENV` is a Vercel system variable, declared in turbo.json).
 */
export function isProductionDeployment(): boolean {
  return process.env.VERCEL_ENV === "production";
}
