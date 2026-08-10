-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "issues" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "issueType" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "location" TEXT,
    "coordinates" TEXT,
    "locationName" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
