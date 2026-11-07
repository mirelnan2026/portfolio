CREATE TYPE "public"."cefr_level" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2');--> statement-breakpoint
CREATE TYPE "public"."employment_type" AS ENUM('full-time', 'contract', 'freelance');--> statement-breakpoint
CREATE TYPE "public"."ownership" AS ENUM('owned', 'contributed');--> statement-breakpoint
CREATE TYPE "public"."skill_category" AS ENUM('frontend', 'ui-libraries', 'backend-and-data', 'testing-and-tooling', 'cloud', 'ai-assisted-development', 'practices');--> statement-breakpoint
CREATE TYPE "public"."source_kind" AS ENUM('cv', 'employment-brief', 'project-brief');--> statement-breakpoint
CREATE TYPE "public"."work_mode" AS ENUM('remote', 'hybrid', 'on-site');--> statement-breakpoint
CREATE TABLE "case_studies" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "case_studies_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"context" text NOT NULL,
	"approach" text NOT NULL,
	"outcome" text NOT NULL,
	"what_it_shows" text NOT NULL,
	"experience_id" integer,
	"phase_id" integer,
	"project_id" integer,
	"url" text,
	"position" integer NOT NULL,
	"source_id" integer NOT NULL,
	CONSTRAINT "case_studies_slug_unique" UNIQUE("slug"),
	CONSTRAINT "case_studies_about_check" CHECK (("case_studies"."experience_id" is not null and "case_studies"."project_id" is null)
        or ("case_studies"."project_id" is not null and "case_studies"."experience_id" is null and "case_studies"."phase_id" is null))
);
--> statement-breakpoint
CREATE TABLE "case_study_skills" (
	"case_study_id" integer NOT NULL,
	"skill_id" integer NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "case_study_skills_case_study_id_skill_id_pk" PRIMARY KEY("case_study_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "education" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "education_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"degree" text NOT NULL,
	"institution" text NOT NULL,
	"location" text NOT NULL,
	"start_year" integer NOT NULL,
	"end_year" integer NOT NULL,
	"position" integer NOT NULL,
	"source_id" integer NOT NULL,
	CONSTRAINT "education_slug_unique" UNIQUE("slug"),
	CONSTRAINT "education_years_check" CHECK ("education"."end_year" >= "education"."start_year")
);
--> statement-breakpoint
CREATE TABLE "experience_highlights" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "experience_highlights_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"experience_id" integer NOT NULL,
	"phase_id" integer,
	"body" text NOT NULL,
	"ownership" "ownership" NOT NULL,
	"featured_title" text,
	"position" integer NOT NULL,
	"source_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experience_phases" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "experience_phases_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"experience_id" integer NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"started_on" date NOT NULL,
	"ended_on" date,
	"industry_id" integer NOT NULL,
	"summary" text NOT NULL,
	"position" integer NOT NULL,
	"source_id" integer NOT NULL,
	CONSTRAINT "experience_phases_experience_id_slug_unique" UNIQUE("experience_id","slug"),
	CONSTRAINT "experience_phases_experience_id_id_unique" UNIQUE("experience_id","id"),
	CONSTRAINT "experience_phases_period_check" CHECK ("experience_phases"."ended_on" is null or "experience_phases"."ended_on" >= "experience_phases"."started_on")
);
--> statement-breakpoint
CREATE TABLE "experience_products" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "experience_products_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"experience_id" integer NOT NULL,
	"phase_id" integer,
	"product_id" integer NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "experience_products_experience_id_phase_id_product_id_unique" UNIQUE NULLS NOT DISTINCT("experience_id","phase_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "experience_skills" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "experience_skills_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"experience_id" integer NOT NULL,
	"phase_id" integer,
	"skill_id" integer NOT NULL,
	"context_note" text,
	"position" integer NOT NULL,
	"source_id" integer NOT NULL,
	CONSTRAINT "experience_skills_experience_id_phase_id_skill_id_unique" UNIQUE NULLS NOT DISTINCT("experience_id","phase_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "experiences" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "experiences_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"company" text NOT NULL,
	"role" text NOT NULL,
	"employment_type" "employment_type" NOT NULL,
	"work_mode" "work_mode",
	"location" text,
	"started_on" date NOT NULL,
	"ended_on" date,
	"position" integer NOT NULL,
	"source_id" integer NOT NULL,
	CONSTRAINT "experiences_slug_unique" UNIQUE("slug"),
	CONSTRAINT "experiences_period_check" CHECK ("experiences"."ended_on" is null or "experiences"."ended_on" >= "experiences"."started_on")
);
--> statement-breakpoint
CREATE TABLE "industries" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "industries_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "industries_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "languages" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "languages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"code" text NOT NULL,
	"name" text NOT NULL,
	"proficiency" text NOT NULL,
	"cefr_level" "cefr_level",
	"position" integer NOT NULL,
	"source_id" integer NOT NULL,
	CONSTRAINT "languages_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "products_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"description" text NOT NULL,
	"industry_id" integer NOT NULL,
	"source_url" text NOT NULL,
	"retrieved_on" date NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "profiles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"headline" text NOT NULL,
	"summary" text NOT NULL,
	"location" text NOT NULL,
	"availability" text NOT NULL,
	"email" text NOT NULL,
	"linkedin_url" text NOT NULL,
	"interests" text[] NOT NULL,
	"source_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_highlights" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "project_highlights_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"project_id" integer NOT NULL,
	"body" text NOT NULL,
	"featured_title" text,
	"position" integer NOT NULL,
	"source_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_skills" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "project_skills_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"project_id" integer NOT NULL,
	"skill_id" integer NOT NULL,
	"context_note" text,
	"position" integer NOT NULL,
	"source_id" integer NOT NULL,
	CONSTRAINT "project_skills_project_id_skill_id_unique" UNIQUE("project_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "projects_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"summary" text NOT NULL,
	"started_on" date NOT NULL,
	"ended_on" date,
	"released_on" date NOT NULL,
	"offline_since" date,
	"website_url" text,
	"repository_url" text,
	"archive_url" text,
	"app_store_url" text,
	"play_store_url" text,
	"position" integer NOT NULL,
	"source_id" integer NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug"),
	CONSTRAINT "projects_period_check" CHECK ("projects"."ended_on" is null or "projects"."ended_on" >= "projects"."started_on"),
	CONSTRAINT "projects_release_check" CHECK ("projects"."released_on" >= "projects"."started_on" and ("projects"."ended_on" is null or "projects"."released_on" <= "projects"."ended_on")),
	CONSTRAINT "projects_offline_check" CHECK ("projects"."offline_since" is null or "projects"."offline_since" >= "projects"."released_on")
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "skills_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"category" "skill_category" NOT NULL,
	"position" integer NOT NULL,
	"source_id" integer NOT NULL,
	CONSTRAINT "skills_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sources_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"kind" "source_kind" NOT NULL,
	"title" text NOT NULL,
	CONSTRAINT "sources_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "case_studies" ADD CONSTRAINT "case_studies_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_studies" ADD CONSTRAINT "case_studies_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_studies" ADD CONSTRAINT "case_studies_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_studies" ADD CONSTRAINT "case_studies_phase_fk" FOREIGN KEY ("experience_id","phase_id") REFERENCES "public"."experience_phases"("experience_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_study_skills" ADD CONSTRAINT "case_study_skills_case_study_id_case_studies_id_fk" FOREIGN KEY ("case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_study_skills" ADD CONSTRAINT "case_study_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "education" ADD CONSTRAINT "education_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_highlights" ADD CONSTRAINT "experience_highlights_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_highlights" ADD CONSTRAINT "experience_highlights_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_highlights" ADD CONSTRAINT "experience_highlights_phase_fk" FOREIGN KEY ("experience_id","phase_id") REFERENCES "public"."experience_phases"("experience_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_phases" ADD CONSTRAINT "experience_phases_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_phases" ADD CONSTRAINT "experience_phases_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_phases" ADD CONSTRAINT "experience_phases_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_products" ADD CONSTRAINT "experience_products_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_products" ADD CONSTRAINT "experience_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_products" ADD CONSTRAINT "experience_products_phase_fk" FOREIGN KEY ("experience_id","phase_id") REFERENCES "public"."experience_phases"("experience_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_skills" ADD CONSTRAINT "experience_skills_experience_id_experiences_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_skills" ADD CONSTRAINT "experience_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_skills" ADD CONSTRAINT "experience_skills_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experience_skills" ADD CONSTRAINT "experience_skills_phase_fk" FOREIGN KEY ("experience_id","phase_id") REFERENCES "public"."experience_phases"("experience_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "languages" ADD CONSTRAINT "languages_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_highlights" ADD CONSTRAINT "project_highlights_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_highlights" ADD CONSTRAINT "project_highlights_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_skills" ADD CONSTRAINT "project_skills_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_skills" ADD CONSTRAINT "project_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_skills" ADD CONSTRAINT "project_skills_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;