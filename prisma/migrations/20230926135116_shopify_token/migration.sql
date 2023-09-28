/*
  Warnings:

  - Added the required column `shopifyAccessToken` to the `Shop` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Shop" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "shopifyAccessToken" TEXT NOT NULL
);
INSERT INTO "new_Shop" ("accessToken", "id", "shop") SELECT "accessToken", "id", "shop" FROM "Shop";
DROP TABLE "Shop";
ALTER TABLE "new_Shop" RENAME TO "Shop";
CREATE UNIQUE INDEX "Shop_shop_key" ON "Shop"("shop");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
