-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('FILM', 'AAJA', 'FRESHERS');

-- AlterTable
ALTER TABLE "Movie" ADD COLUMN "contentType" "ContentType" NOT NULL DEFAULT 'FILM';

UPDATE "Movie" SET "contentType" = 'AAJA' WHERE "isAajaFilm" = true;

UPDATE "Movie"
SET "contentType" = 'FRESHERS'
WHERE "contentType" = 'FILM'
  AND (
    title ILIKE '%freshers%'
    OR title ILIKE '%fresher%'
  );

CREATE INDEX "Movie_contentType_idx" ON "Movie"("contentType");
