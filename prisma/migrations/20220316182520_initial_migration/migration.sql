-- CreateEnum
CREATE TYPE "Category" AS ENUM ('overall', 'identifiability', 'colors', 'symbols', 'typeface', 'clarity');

-- CreateTable
CREATE TABLE "Image" (
    "id" SERIAL NOT NULL,
    "plateId" INTEGER NOT NULL,
    "url" VARCHAR(255),

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jurisdiction" (
    "id" SERIAL NOT NULL,
    "abbreviation" VARCHAR(2) NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "Jurisdiction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plate" (
    "id" SERIAL NOT NULL,
    "jurisdictionId" INTEGER NOT NULL,
    "startYear" INTEGER,
    "endYear" INTEGER,

    CONSTRAINT "Plate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Score" (
    "plateId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "category" "Category" NOT NULL,
    "value" INTEGER CONSTRAINT value_within_0_10 CHECK ("value" >= 0 AND "value" <= 10),

    CONSTRAINT "Score_pkey" PRIMARY KEY ("plateId","userId","category")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "plateId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "description" VARCHAR(2047) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "serial" VARCHAR(255) NOT NULL CONSTRAINT serial_is_capital CHECK ("serial" = UPPER("serial")),
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Jurisdiction_abbreviation_unique" ON "Jurisdiction"("abbreviation");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_unique" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_serial_unique" ON "User"("serial");

-- CreateIndex
CREATE UNIQUE INDEX "Image_url_unique" ON "Image"("url");

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_plateId_unique" ON "Review"("userId", "plateId");

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_plateId_fkey" FOREIGN KEY ("plateId") REFERENCES "Plate"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Plate" ADD CONSTRAINT "Plate_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_plateId_fkey" FOREIGN KEY ("plateId") REFERENCES "Plate"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_plateId_fkey" FOREIGN KEY ("plateId") REFERENCES "Plate"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;