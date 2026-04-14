-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VOLUNTEER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Cat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "intakeDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dob" DATETIME,
    "notes" TEXT NOT NULL DEFAULT '',
    "medicalFlags" TEXT NOT NULL DEFAULT '',
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "LogEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "catId" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
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
    CONSTRAINT "LogEntry_catId_fkey" FOREIGN KEY ("catId") REFERENCES "Cat" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LogEntry_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Cat_archivedAt_idx" ON "Cat"("archivedAt");

-- CreateIndex
CREATE INDEX "LogEntry_catId_recordedAt_idx" ON "LogEntry"("catId", "recordedAt");
