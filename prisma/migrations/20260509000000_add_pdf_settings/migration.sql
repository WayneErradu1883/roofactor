-- CreateTable
CREATE TABLE "PdfSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "companyName" TEXT NOT NULL DEFAULT 'Roofactor',
    "companyTagline" TEXT NOT NULL DEFAULT 'Professional Roof Coating Solutions',
    "companyLogo" TEXT,
    "documentTitle" TEXT NOT NULL DEFAULT 'QUOTATION',
    "termsAndConditions" TEXT,
    "footerText" TEXT NOT NULL DEFAULT 'powered for Nomiplex 2026',
    "quoteValidityDays" INTEGER NOT NULL DEFAULT 30,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PdfSettings_pkey" PRIMARY KEY ("id")
);

-- Seed default row
INSERT INTO "PdfSettings" ("id", "updatedAt")
VALUES ('default', NOW())
ON CONFLICT ("id") DO NOTHING;
