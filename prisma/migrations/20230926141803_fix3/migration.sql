/*
  Warnings:

  - Made the column `sessionId` on table `Shop` required. This step will fail if there are existing NULL values in that column.

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
