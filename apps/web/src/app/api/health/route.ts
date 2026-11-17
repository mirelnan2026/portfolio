import { connection } from "next/server";
import { createRateLimit } from "@/server/rate-limit";

const rateLimit = createRateLimit({ name: "health", requests: 10, window: "10 s" });

export async function GET(request: Request): Promise<Response> {
  // Request time only: with Cache Components a GET that reads nothing dynamic is prerendered at build.
  await connection();
  const limited = await rateLimit(request);
  if (limited) return limited;
  return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
