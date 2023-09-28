/*
  Warnings:

  - Added the required column `paymentId` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Payment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requestId" TEXT NOT NULL,
    "returnUrl" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL
);
INSERT INTO "new_Payment" ("id", "requestId", "returnUrl") SELECT "id", "requestId", "returnUrl" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE UNIQUE INDEX "Payment_requestId_key" ON "Payment"("requestId");
CREATE UNIQUE INDEX "Payment_paymentId_key" ON "Payment"("paymentId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
