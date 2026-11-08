import { z } from "zod";

const adminEnvSchema = z.object({
  DATABASE_ADMIN_URL: z.url({ protocol: /^postgres(ql)?$/ }),
});

/**
 * The owner connection string that migrations and the seed use. The error never echoes the value:
 * it is a secret, and a wrong one is still close to the real one.
 */
export function readAdminDatabaseUrl(env: Record<string, string | undefined>): string {
  const result = adminEnvSchema.safeParse(env);
  if (!result.success) {
    throw new Error(
      "DATABASE_ADMIN_URL is missing or is not a postgresql:// URL: copy packages/db/.env.example " +
        "to packages/db/.env.local and fill it in.",
    );
  }
  return result.data.DATABASE_ADMIN_URL;
}
