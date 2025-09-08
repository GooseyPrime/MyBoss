-- AlterTable
ALTER TABLE "public"."Repo" ADD COLUMN "url" TEXT;

-- AlterTable
ALTER TABLE "public"."Repo" ADD COLUMN "provider" TEXT;

-- AlterTable
ALTER TABLE "public"."AuditRun" ADD COLUMN "finishedAt" TIMESTAMP(3);