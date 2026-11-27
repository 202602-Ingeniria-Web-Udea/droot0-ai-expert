-- CreateEnum
CREATE TYPE "FeedbackValue" AS ENUM ('UP', 'DOWN');

-- CreateTable
CREATE TABLE "message_feedback" (
    "id" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "value" "FeedbackValue" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "message_feedback_userId_idx" ON "message_feedback"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "message_feedback_messageId_userId_key" ON "message_feedback"("messageId", "userId");

-- AddForeignKey
ALTER TABLE "message_feedback" ADD CONSTRAINT "message_feedback_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_feedback" ADD CONSTRAINT "message_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Supabase exposes the public schema through its Data API. The application
-- accesses PostgreSQL through Prisma only, so message feedback must be default
-- deny for the Data API roles as well.
ALTER TABLE public.message_feedback ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.message_feedback FROM anon, authenticated;
