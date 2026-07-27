-- CreateTable
CREATE TABLE "MessageCenterUpdate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "service" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "content" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "details" JSONB NOT NULL DEFAULT '[]',
    "isMajorChange" BOOLEAN NOT NULL DEFAULT false,
    "severity" TEXT,
    "actionRequiredByDateTime" TIMESTAMP(3),
    "published" TIMESTAMP(3),
    "lastUpdated" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "MessageCenterUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncState" (
    "key" TEXT NOT NULL,
    "lastSyncAt" TIMESTAMP(3) NOT NULL,
    "lastError" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncState_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "MessageCenterUpdate_status_idx" ON "MessageCenterUpdate"("status");

-- CreateIndex
CREATE INDEX "MessageCenterUpdate_lastUpdated_idx" ON "MessageCenterUpdate"("lastUpdated");
