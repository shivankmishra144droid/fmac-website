-- CreateEnum
CREATE TYPE "MovieCategory" AS ENUM ('MOVIE', 'SHORT', 'DOCUMENTARY', 'EXPERIMENTAL');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN');

-- CreateTable
CREATE TABLE "Movie" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "releaseYear" INTEGER NOT NULL,
    "posterUrl" TEXT,
    "thumbnailUrl" TEXT,
    "youtubeId" TEXT,
    "youtubeUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "category" "MovieCategory" NOT NULL DEFAULT 'SHORT',
    "runtimeSeconds" INTEGER,
    "format" TEXT,
    "crew" TEXT,
    "isLatestRelease" BOOLEAN NOT NULL DEFAULT false,
    "isFmacSelect" BOOLEAN NOT NULL DEFAULT false,
    "isAajaFilm" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Movie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationInfo" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "mapEmbedUrl" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocationInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "description" TEXT,
    "laurel" TEXT,
    "movieTitle" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Movie_slug_key" ON "Movie"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Movie_youtubeId_key" ON "Movie"("youtubeId");

-- CreateIndex
CREATE INDEX "Movie_releaseYear_idx" ON "Movie"("releaseYear");

-- CreateIndex
CREATE INDEX "Movie_isLatestRelease_idx" ON "Movie"("isLatestRelease");

-- CreateIndex
CREATE INDEX "Movie_youtubeId_idx" ON "Movie"("youtubeId");

-- CreateIndex
CREATE INDEX "Movie_category_idx" ON "Movie"("category");

-- CreateIndex
CREATE INDEX "Movie_publishedAt_idx" ON "Movie"("publishedAt");

-- CreateIndex
CREATE INDEX "Movie_isAajaFilm_idx" ON "Movie"("isAajaFilm");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");
