import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * The server-side variables the app needs, validated once at startup. The error names the variable and
 * where to set it, never its value, so a secret cannot end up in a build or server log.
 */
export function readServerEnv(env: Record<string, string | undefined>): ServerEnv {
  const result = serverEnvSchema.safeParse(env);
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((issue) => issue.path.join(".")))];
    throw new Error(
      `Missing or invalid environment variables: ${names.join(", ")}. Copy apps/web/.env.example to ` +
        "apps/web/.env.local and fill it in (on Vercel: Project Settings → Environment Variables).",
    );
  }
  return result.data;
}
