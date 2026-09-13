-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "name" TEXT,
    "surname" TEXT,
    "physicalAddress" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Customer_userId_idx" ON "Customer"("userId");

-- AlterTable
ALTER TABLE "Estimate" ADD COLUMN "quoteNumber" TEXT,
ADD COLUMN "sentAt" TIMESTAMP(3),
ADD COLUMN "customerId" TEXT;

-- CreateIndex
CREATE INDEX "Estimate_customerId_idx" ON "Estimate"("customerId");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
