CREATE SCHEMA "identity";
--> statement-breakpoint
CREATE SCHEMA "trip";
--> statement-breakpoint
CREATE SCHEMA "payment";
--> statement-breakpoint
CREATE TABLE "identity"."riders" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "riders_email_unique" UNIQUE("email")
);
