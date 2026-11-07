import type { Language } from "@mirelnan/domain";

export const languages = [
  {
    code: "ro",
    name: "Romanian",
    proficiency: "Native speaker",
    cefrLevel: null,
    sourceSlug: "cv",
  },
  {
    code: "en",
    name: "English",
    proficiency: "Professional working proficiency",
    cefrLevel: "C1",
    sourceSlug: "cv",
  },
] satisfies Language[];
