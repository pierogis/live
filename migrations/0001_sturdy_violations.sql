DROP TABLE IF EXISTS _prisma_migrations;
ALTER TABLE "Category" RENAME TO "categories";
ALTER TABLE "Image" RENAME TO "images";
ALTER TABLE "Jurisdiction" RENAME TO "jurisdictions";
ALTER TABLE "Model" RENAME TO "models";
ALTER TABLE "Plate" RENAME TO "plates";
ALTER TABLE "Review" RENAME TO "reviews";
ALTER TABLE "Score" RENAME TO "scores";
ALTER TABLE "User" RENAME TO "users";
ALTER TABLE "Ware" RENAME TO "wares";
ALTER TABLE "categories" RENAME COLUMN "wareName" TO "ware_name";
ALTER TABLE "images" RENAME COLUMN "modelId" TO "model_id";
ALTER TABLE "models" RENAME COLUMN "wareId" TO "ware_id";
ALTER TABLE "plates" RENAME COLUMN "modelId" TO "model_id";
ALTER TABLE "plates" RENAME COLUMN "jurisdictionId" TO "jurisdiction_id";
ALTER TABLE "plates" RENAME COLUMN "startYear" TO "start_year";
ALTER TABLE "plates" RENAME COLUMN "endYear" TO "end_year";
ALTER TABLE "reviews" RENAME COLUMN "modelId" TO "model_id";
ALTER TABLE "reviews" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "scores" RENAME COLUMN "modelId" TO "model_id";
ALTER TABLE "scores" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "scores" RENAME COLUMN "categoryId" TO "category_id";
ALTER TABLE "users" RENAME COLUMN "isAdmin" TO "is_admin";
ALTER TABLE "categories" ALTER COLUMN "name" SET DATA TYPE varchar(256);
ALTER TABLE "categories" ALTER COLUMN "ware_name" SET DATA TYPE varchar(256);
ALTER TABLE "images" ALTER COLUMN "url" SET DATA TYPE varchar(256);
ALTER TABLE "jurisdictions" ALTER COLUMN "name" SET DATA TYPE varchar(256);
ALTER TABLE "reviews" ALTER COLUMN "description" SET DATA TYPE varchar(2048);
ALTER TABLE "users" ALTER COLUMN "email" SET DATA TYPE varchar(256);
ALTER TABLE "users" ALTER COLUMN "serial" SET DATA TYPE varchar(256);
ALTER TABLE "users" ALTER COLUMN "is_admin" DROP DEFAULT;
ALTER TABLE "wares" ALTER COLUMN "name" SET DATA TYPE varchar(256);

ALTER TABLE "categories" RENAME CONSTRAINT "Category_pkey" TO "categories_pkey";
ALTER TABLE "categories" RENAME CONSTRAINT "Category_wareName_fkey" TO "categories_ware_name_wares_name_fk";

ALTER TABLE "images" RENAME CONSTRAINT "Image_pkey" TO "images_pkey";
ALTER TABLE "images" RENAME CONSTRAINT "Image_modelId_fkey" TO "images_model_id_models_id_fk";

ALTER TABLE "jurisdictions" RENAME CONSTRAINT "Jurisdiction_pkey" TO "jurisdictions_pkey";

ALTER TABLE "models" RENAME CONSTRAINT "Model_pkey" TO "models_pkey";
ALTER TABLE "models" RENAME CONSTRAINT "Model_wareId_fkey" TO "models_ware_id_wares_id_fk";

ALTER TABLE "plates" RENAME CONSTRAINT "Plate_pkey" TO "plates_pkey";
ALTER TABLE "plates" RENAME CONSTRAINT "Plate_modelId_fkey" TO "plates_model_id_models_id_fk";
ALTER TABLE "plates" RENAME CONSTRAINT "Plate_jurisdictionId_fkey" TO "plates_jurisdiction_id_jurisdictions_id_fk";

ALTER TABLE "reviews" RENAME CONSTRAINT "Review_pkey" TO "reviews_pkey";
ALTER TABLE "reviews" RENAME CONSTRAINT "Review_modelId_fkey" TO "reviews_model_id_models_id_fk";
ALTER TABLE "reviews" RENAME CONSTRAINT "Review_userId_fkey" TO "reviews_user_id_users_id_fk";

ALTER TABLE "scores" RENAME CONSTRAINT "Score_pkey" TO "scores_pkey";
ALTER TABLE "scores" RENAME CONSTRAINT "Score_modelId_fkey" TO "scores_model_id_models_id_fk";
ALTER TABLE "scores" RENAME CONSTRAINT "Score_userId_fkey" TO "scores_user_id_users_id_fk";
ALTER TABLE "scores" RENAME CONSTRAINT "Score_categoryId_fkey" TO "scores_category_id_categories_id_fk";

DROP INDEX IF EXISTS "Category_name_wareName_unique";
DROP INDEX IF EXISTS "Image_url_unique";
DROP INDEX IF EXISTS "Jurisdiction_abbreviation_unique";
DROP INDEX IF EXISTS "Review_userId_modelId_unique";
DROP INDEX IF EXISTS "User_email_unique";
DROP INDEX IF EXISTS "User_serial_unique";
CREATE UNIQUE INDEX IF NOT EXISTS "categories_name_wareName_unique" ON "categories" ("name","ware_name");
CREATE UNIQUE INDEX IF NOT EXISTS "images_url_unique" ON "images" ("url");
CREATE UNIQUE INDEX IF NOT EXISTS "jurisdictions_abbreviation_unique" ON "jurisdictions" ("abbreviation");
CREATE UNIQUE INDEX IF NOT EXISTS "reviews_user_id_model_id_unique" ON "reviews" ("model_id","user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" ("email");
CREATE UNIQUE INDEX IF NOT EXISTS "users_serial_unique" ON "users" ("serial");