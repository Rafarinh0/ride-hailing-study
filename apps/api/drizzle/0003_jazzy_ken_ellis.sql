CREATE TYPE "payment"."ledger_account" AS ENUM('rider', 'driver', 'platform');--> statement-breakpoint
CREATE TABLE "payment"."charges" (
	"id" uuid PRIMARY KEY NOT NULL,
	"trip_id" uuid NOT NULL,
	"rider_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "charges_trip_id_unique" UNIQUE("trip_id")
);
--> statement-breakpoint
CREATE TABLE "payment"."ledger_entries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"charge_id" uuid NOT NULL,
	"account" "payment"."ledger_account" NOT NULL,
	"account_id" uuid,
	"amount_cents" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment"."ledger_entries" ADD CONSTRAINT "ledger_entries_charge_id_charges_id_fk" FOREIGN KEY ("charge_id") REFERENCES "payment"."charges"("id") ON DELETE no action ON UPDATE no action;