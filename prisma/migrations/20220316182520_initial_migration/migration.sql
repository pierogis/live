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
    "value" INTEGER,
    "explanation" VARCHAR(255),

    CONSTRAINT "Score_pkey" PRIMARY KEY ("plateId","userId","category")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "serial" VARCHAR(255) NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_unique" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_serial_unique" ON "User"("serial");

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_plateId_foreign" FOREIGN KEY ("plateId") REFERENCES "Plate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Plate" ADD CONSTRAINT "Plate_jurisdictionId_fkey" FOREIGN KEY ("jurisdictionId") REFERENCES "Jurisdiction"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_plateId_fkey" FOREIGN KEY ("plateId") REFERENCES "Plate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
