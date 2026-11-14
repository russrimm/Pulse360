-- CreateTable
CREATE TABLE "BriefingSnapshot" (
    "id" TEXT NOT NULL,
    "weekKey" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BriefingSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BriefingSnapshot_weekKey_product_key" ON "BriefingSnapshot"("weekKey", "product");
