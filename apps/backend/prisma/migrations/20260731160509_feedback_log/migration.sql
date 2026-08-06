-- The admin console has a Feedback Log. Deliberately not tied to an order or a
-- product: forcing a category on someone reporting a problem is how you stop
-- them reporting it.
CREATE TYPE "FeedbackStatus" AS ENUM ('OPEN', 'RESOLVED');

CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "authorId" TEXT,
    "authorRole" "Role" NOT NULL,
    "authorLabel" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'OPEN',
    "adminNote" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- The log is read as a queue: open items first, newest within that.
CREATE INDEX "feedback_status_createdAt_idx" ON "feedback"("status", "createdAt");

-- SET NULL rather than CASCADE: feedback outlives the account that left it.
-- authorRole and authorLabel are snapshots so the log stays readable after.
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
