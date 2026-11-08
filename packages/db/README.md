# @mirelnan/db

The database adapter: the Drizzle schema, the migrations and the seed (`writeCvData`). The repository
implementations come at step 2.7b and the Neon client at step 3. Nothing outside this package sees a table or a database id; consumers get
`domain` types through the repository interfaces.

## Data model

Each `domain` aggregate is split into a root table and one table per list. `id` is a surrogate key used only
inside the database; the domain identity is `slug` (`code` for languages).

```mermaid
erDiagram
    sources ||--o{ experiences : "source_id"
    industries ||--o{ experience_phases : "industry_id"
    industries ||--o{ products : "industry_id"

    experiences ||--o{ experience_phases : "experience_id"
    experiences ||--o{ experience_highlights : "experience_id"
    experiences ||--o{ experience_skills : "experience_id"
    experiences ||--o{ experience_products : "experience_id"
    experience_phases |o--o{ experience_highlights : "(experience_id, phase_id)"
    experience_phases |o--o{ experience_skills : "(experience_id, phase_id)"
    experience_phases |o--o{ experience_products : "(experience_id, phase_id)"
    skills ||--o{ experience_skills : "skill_id"
    products ||--o{ experience_products : "product_id"

    projects ||--o{ project_highlights : "project_id"
    projects ||--o{ project_skills : "project_id"
    skills ||--o{ project_skills : "skill_id"

    experiences |o--o{ case_studies : "experience_id"
    experience_phases |o--o{ case_studies : "(experience_id, phase_id)"
    projects |o--o{ case_studies : "project_id"
    case_studies ||--o{ case_study_skills : "case_study_id"
    skills ||--o{ case_study_skills : "skill_id"

    sources {
        int id PK
        text slug UK
        source_kind kind
        text title
    }
    experiences {
        int id PK
        text slug UK
        text company
        text role
        employment_type employment_type
        work_mode work_mode "nullable"
        date started_on
        date ended_on "nullable"
        int source_id FK
    }
    experience_phases {
        int id PK
        int experience_id FK
        text slug "UK with experience_id"
        date started_on
        date ended_on "nullable"
        int industry_id FK
        int source_id FK
    }
    experience_highlights {
        int id PK
        int experience_id FK
        int phase_id FK "nullable"
        text body
        ownership ownership
        text featured_title "nullable"
        int source_id FK
    }
    experience_skills {
        int id PK
        int experience_id FK
        int phase_id FK "nullable"
        int skill_id FK
        text context_note "nullable"
        int source_id FK
    }
    experience_products {
        int id PK
        int experience_id FK
        int phase_id FK "nullable"
        int product_id FK
    }
    projects {
        int id PK
        text slug UK
        date started_on
        date released_on
        date offline_since "nullable"
        text website_url "nullable"
        text repository_url "nullable"
        int source_id FK
    }
    project_highlights {
        int id PK
        int project_id FK
        text body
        int source_id FK
    }
    project_skills {
        int id PK
        int project_id FK
        int skill_id FK
        int source_id FK
    }
    case_studies {
        int id PK
        text slug UK
        int experience_id FK "nullable"
        int phase_id FK "nullable"
        int project_id FK "nullable"
        int source_id FK
    }
    case_study_skills {
        int case_study_id PK, FK
        int skill_id PK, FK
    }
    skills {
        int id PK
        text slug UK
        skill_category category
        int source_id FK
    }
    products {
        int id PK
        text slug UK
        text url
        int industry_id FK
    }
    industries {
        int id PK
        text slug UK
    }
```

`||--o{` reads "one to zero or more"; `|o--o{` is the same with an optional parent (a nullable foreign key).
Not drawn, to keep the diagram readable: `profiles`, `education` and `languages` (simple tables with a
`source_id`), the `source_id` link of every table except `experiences`, and the `position` column that every
list has. The full definition is in [`src/schema`](src/schema) and the SQL in [`migrations`](migrations).

## Rules the database enforces

The `domain` schemas validate the data before the seed writes it; the constraints repeat the important rules,
so the database stays consistent even when it is written to directly.

| Rule                                                          | Constraint                                                                |
| ------------------------------------------------------------- | ------------------------------------------------------------------------- |
| A period does not end before it starts                        | `CHECK` on `experiences`, `experience_phases`, `projects`, `education`    |
| A release is within the project period; offline after release | `projects_release_check`, `projects_offline_check`                        |
| A phase slug is unique within its experience                  | `UNIQUE (experience_id, slug)`                                            |
| A part of an experience can only point to one of its phases   | composite foreign key `(experience_id, phase_id)` → `experience_phases`   |
| A skill or product appears once per phase (or once without)   | `UNIQUE NULLS NOT DISTINCT (experience_id, phase_id, …)`                  |
| A case study is about an experience (and phase) or a project  | `case_studies_about_check`                                                |
| Enum values match the domain                                  | Postgres enums built from the `domain` zod enums                          |
| Parts are deleted with their aggregate, nothing else is       | `ON DELETE CASCADE` inside an aggregate; references between them block it |

A phase must also lie within its experience's period. That rule compares two tables, so it stays in the
`domain` schema rather than in a trigger.

## Seed

`writeCvData(db, data)` rebuilds the database from `@mirelnan/cv-data`, the source of truth:

1. It validates the data with `cvDataSchema` from `domain`; invalid data is rejected before the database is touched.
2. In one transaction, it empties every table (`TRUNCATE … RESTART IDENTITY CASCADE`) and inserts all rows in
   dependency order, so running it again gives the same rows with the same ids.
3. A slug that points to nothing throws an error naming it, and the transaction rolls back completely.

It takes the driver-independent `Database` type (`src/database.ts`): the tests run it on PGlite, an in-memory
Postgres, with the real migrations; from step 3 it runs on Neon.

## Commands

| Command                                         | What it does                                                            |
| ----------------------------------------------- | ----------------------------------------------------------------------- |
| `pnpm --filter @mirelnan/db db:generate --name` | Writes a new SQL migration from the schema changes (no database needed) |
| `pnpm --filter @mirelnan/db db:check`           | Checks that the migrations and their snapshots are consistent           |
| `pnpm --filter @mirelnan/db test`               | Runs the seed tests on PGlite (in-memory Postgres, no database needed)  |

Migrations are generated, reviewed in the pull request and committed; they are never edited by hand, and
`drizzle-kit push` is never used against production.
