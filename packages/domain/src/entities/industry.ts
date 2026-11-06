import { z } from "zod";
import { slugSchema } from "../values/slug";
import { textSchema } from "../values/text";

/** An industry the owner has worked in, e.g. "Video & ad-tech". */
export const industrySchema = z.strictObject({
  slug: slugSchema,
  name: textSchema,
});

export type Industry = z.infer<typeof industrySchema>;
