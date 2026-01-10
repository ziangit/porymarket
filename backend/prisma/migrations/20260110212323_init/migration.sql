-- CreateTable
CREATE TABLE `alerts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `wallet_address` VARCHAR(191) NOT NULL,
    `market_id` VARCHAR(191) NOT NULL,
    `market_question` TEXT NOT NULL,
    `trade_size` DECIMAL(20, 2) NOT NULL,
    `outcome` VARCHAR(191) NULL,
    `price` DECIMAL(10, 6) NULL,
    `wallet_age` INTEGER NOT NULL,
    `total_markets` INTEGER NOT NULL,
    `radar_score` DECIMAL(5, 2) NOT NULL,
    `wc_tx_ratio` DECIMAL(5, 4) NOT NULL,
    `timestamp` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `alerts_timestamp_idx`(`timestamp`),
    INDEX `alerts_wallet_address_idx`(`wallet_address`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trades` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `wallet_address` VARCHAR(191) NOT NULL,
    `market_id` VARCHAR(191) NOT NULL,
    `size` DECIMAL(20, 2) NOT NULL,
    `price` DECIMAL(10, 6) NULL,
    `outcome` VARCHAR(191) NULL,
    `timestamp` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `trades_wallet_address_idx`(`wallet_address`),
    INDEX `trades_market_id_idx`(`market_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `simulations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `alert_id` INTEGER NOT NULL,
    `entry_price` DECIMAL(10, 6) NOT NULL,
    `entry_amount` DECIMAL(20, 2) NOT NULL,
    `exit_price` DECIMAL(10, 6) NULL,
    `exit_amount` DECIMAL(20, 2) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'open',
    `pnl` DECIMAL(20, 2) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `closed_at` DATETIME(3) NULL,

    INDEX `simulations_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `simulations` ADD CONSTRAINT `simulations_alert_id_fkey` FOREIGN KEY (`alert_id`) REFERENCES `alerts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
