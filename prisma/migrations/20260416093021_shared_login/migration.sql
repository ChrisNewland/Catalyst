/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `volunteerId` on the `LogEntry` table. All the data in the column will be lost.
  - Added the required column `loggedByName` to the `LogEntry` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_email_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "User";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LogEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "catId" TEXT NOT NULL,
    "loggedByName" TEXT NOT NULL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "foodOffered" TEXT NOT NULL,
    "waterIntake" TEXT NOT NULL,
    "urinated" BOOLEAN NOT NULL DEFAULT false,
    "defecated" BOOLEAN NOT NULL DEFAULT false,
    "bristolScore" INTEGER,
    "weightGrams" INTEGER,
    "condition" TEXT NOT NULL DEFAULT 'GOOD',
    "behaviourNotes" TEXT,
    "generalNotes" TEXT,
    CONSTRAINT "LogEntry_catId_fkey" FOREIGN KEY ("catId") REFERENCES "Cat" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LogEntry" ("behaviourNotes", "bristolScore", "catId", "condition", "defecated", "foodOffered", "generalNotes", "id", "recordedAt", "urinated", "waterIntake", "weightGrams") SELECT "behaviourNotes", "bristolScore", "catId", "condition", "defecated", "foodOffered", "generalNotes", "id", "recordedAt", "urinated", "waterIntake", "weightGrams" FROM "LogEntry";
DROP TABLE "LogEntry";
ALTER TABLE "new_LogEntry" RENAME TO "LogEntry";
CREATE INDEX "LogEntry_catId_recordedAt_idx" ON "LogEntry"("catId", "recordedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
