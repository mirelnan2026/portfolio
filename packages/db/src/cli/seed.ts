import { cvData } from "@mirelnan/cv-data";
import { connectToPostgres } from "../client";
import { writeCvData } from "../seed/write-cv-data";
import { readAdminDatabaseUrl } from "./admin-env";

// `pnpm --filter @mirelnan/db db:seed`: rebuilds every table from cv-data, in one transaction.
const connection = connectToPostgres(readAdminDatabaseUrl(process.env));
try {
  await writeCvData(connection.db, cvData);
  console.log(
    `Seeded ${String(cvData.experiences.length)} experiences, ${String(cvData.skills.length)} skills ` +
      `and ${String(cvData.caseStudies.length)} case studies.`,
  );
} finally {
  await connection.close();
}
