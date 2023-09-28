/*
  Warnings:

  - Added the required column `status` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Payment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requestId" TEXT NOT NULL,
    "returnUrl" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "mamoPaymentId" TEXT,
    "amount" TEXT NOT NULL,
    "status" TEXT NOT NULL
);
INSERT INTO "new_Payment" ("amount", "id", "mamoPaymentId", "paymentId", "requestId", "returnUrl") SELECT "amount", "id", "mamoPaymentId", "paymentId", "requestId", "returnUrl" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE UNIQUE INDEX "Payment_requestId_key" ON "Payment"("requestId");
CREATE UNIQUE INDEX "Payment_paymentId_key" ON "Payment"("paymentId");
CREATE UNIQUE INDEX "Payment_mamoPaymentId_key" ON "Payment"("mamoPaymentId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
