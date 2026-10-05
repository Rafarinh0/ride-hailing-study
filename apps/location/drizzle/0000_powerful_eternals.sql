CREATE SCHEMA "location";
--> statement-breakpoint
CREATE TABLE "location"."driver_positions" (
	"driver_id" uuid PRIMARY KEY NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL
);
