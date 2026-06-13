CREATE TABLE `ComboProduct` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `comboId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    UNIQUE INDEX `ComboProduct_comboId_productId_key` (`comboId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ComboProduct` ADD CONSTRAINT `ComboProduct_comboId_fkey` FOREIGN KEY (`comboId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ComboProduct` ADD CONSTRAINT `ComboProduct_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
