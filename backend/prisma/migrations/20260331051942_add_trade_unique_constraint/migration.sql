/*
  Warnings:

  - A unique constraint covering the columns `[wallet_address,market_id,timestamp]` on the table `trades` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `trades_wallet_address_market_id_timestamp_key` ON `trades`(`wallet_address`, `market_id`, `timestamp`);
