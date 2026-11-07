import { z } from "zod";
import { slugSchema } from "../values/slug";
import { textSchema } from "../values/text";

/** A year between 1900 and 2100; the CV gives education periods in years only. */
const yearSchema = z.int().min(1900).max(2100);

export const educationSchema = z
  .strictObject({
    slug: slugSchema,
    degree: textSchema,
    institution: textSchema,
    location: textSchema,
    startYear: yearSchema,
    endYear: yearSchema,
    sourceSlug: slugSchema,
  })
  .refine((education) => education.endYear >= education.startYear, {
    message: "endYear must not be before startYear",
    path: ["endYear"],
  });

export type Education = z.infer<typeof educationSchema>;
