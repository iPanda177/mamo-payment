/*
  Warnings:

  - You are about to drop the column `paymentName` on the `Shop` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Shop" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL
);
INSERT INTO "new_Shop" ("accessToken", "id", "sessionId", "shop") SELECT "accessToken", "id", "sessionId", "shop" FROM "Shop";
DROP TABLE "Shop";
ALTER TABLE "new_Shop" RENAME TO "Shop";
CREATE UNIQUE INDEX "Shop_shop_key" ON "Shop"("shop");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
