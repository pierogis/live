-- Custom SQL migration file, put you code below! --
ALTER SEQUENCE "Category_id_seq" RENAME TO "categories_id_seq";
ALTER SEQUENCE "Image_id_seq" RENAME to "images_id_seq";
ALTER SEQUENCE "Jurisdiction_id_seq" RENAME to "jurisdictions_id_seq";
ALTER SEQUENCE "Model_id_seq" RENAME to "models_id_seq";
ALTER SEQUENCE "Review_id_seq" RENAME to "reviews_id_seq";
ALTER SEQUENCE "User_id_seq" RENAME to "users_id_seq";