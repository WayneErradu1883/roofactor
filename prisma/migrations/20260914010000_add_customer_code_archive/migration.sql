-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "customerCode" TEXT,
ADD COLUMN "archivedAt" TIMESTAMP(3);

-- Backfill customer codes for any existing rows:
-- letter = first A–Z of name/surname/email (fallback X), then a per-letter sequence.
WITH ranked AS (
  SELECT
    "id",
    COALESCE(
      NULLIF(UPPER(SUBSTRING(REGEXP_REPLACE(COALESCE("name", "surname", "email", ''), '[^A-Za-z]', '', 'g') FROM 1 FOR 1)), ''),
      'X'
    ) AS letter,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(
        NULLIF(UPPER(SUBSTRING(REGEXP_REPLACE(COALESCE("name", "surname", "email", ''), '[^A-Za-z]', '', 'g') FROM 1 FOR 1)), ''),
        'X'
      )
      ORDER BY "createdAt", "id"
    ) AS seq
  FROM "Customer"
)
UPDATE "Customer" c
SET "customerCode" = r.letter || LPAD(r.seq::text, 3, '0')
FROM ranked r
WHERE c."id" = r."id";

-- CreateIndex
CREATE UNIQUE INDEX "Customer_customerCode_key" ON "Customer"("customerCode");
