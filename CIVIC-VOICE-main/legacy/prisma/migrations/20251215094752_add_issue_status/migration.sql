-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED');

-- AlterTable
ALTER TABLE "issues" ADD COLUMN     "status" "IssueStatus" NOT NULL DEFAULT 'SUBMITTED';
