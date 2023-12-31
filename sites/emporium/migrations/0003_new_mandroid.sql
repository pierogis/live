DO $$ BEGIN
 CREATE TYPE "ware" AS ENUM('plate');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "categories" RENAME COLUMN "ware_name" TO "ware";
ALTER TABLE "categories" DROP CONSTRAINT "categories_ware_name_wares_name_fk";
ALTER TABLE "categories" ALTER COLUMN "ware" SET DATA TYPE ware USING ware::ware;

ALTER TABLE "models" ADD COLUMN "ware" ware;
UPDATE "models" SET "ware" = 'plate';
ALTER TABLE "models" ALTER COLUMN "ware" SET NOT NULL;

ALTER TABLE "models" DROP COLUMN "ware_id";

DROP TABLE "wares";

DROP INDEX IF EXISTS "categories_name_wareName_unique";
CREATE UNIQUE INDEX IF NOT EXISTS "categories_name_ware_unique" ON "categories" ("name","ware");