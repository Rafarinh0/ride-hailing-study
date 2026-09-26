CREATE TYPE "trip"."trip_status" AS ENUM('requested', 'accepted', 'in_progress', 'finished', 'cancelled');--> statement-breakpoint
CREATE TABLE "trip"."trips" (
	"id" uuid PRIMARY KEY NOT NULL,
	"rider_id" uuid NOT NULL,
	"driver_id" uuid,
	"status" "trip"."trip_status" NOT NULL,
	"requested_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone
);
