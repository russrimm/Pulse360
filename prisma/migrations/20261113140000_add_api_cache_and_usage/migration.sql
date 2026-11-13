-- CreateTable
CREATE TABLE "ApiCache" (
    "key" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiCache_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "ApiUsage" (
    "day" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiUsage_pkey" PRIMARY KEY ("day","route")
);

-- CreateIndex
CREATE INDEX "ApiCache_expiresAt_idx" ON "ApiCache"("expiresAt");
