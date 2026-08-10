-- Migration: Ajout du système de groupes/classes
-- Date: Avril 2026
-- Description: Crée la table groups et modifie students pour supporter les groupes par année académique

-- 1. Créer la table des groupes
CREATE TABLE IF NOT EXISTS `groups` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL COMMENT 'Nom du groupe (ex: ASUR1, ASUR2)',
  `academicYear` VARCHAR(255) NOT NULL COMMENT 'Année académique (ex: 2024-2025)',
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_group_year` (`name`, `academicYear`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Supprimer l'ancienne colonne group (string) si elle existe
SET @exist := (SELECT COUNT(*) FROM information_schema.columns 
               WHERE table_schema = DATABASE() 
               AND table_name = 'students' 
               AND column_name = 'group');

SET @sqlstmt := IF(@exist > 0, 'ALTER TABLE students DROP COLUMN `group`', 'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Ajouter la colonne groupId (foreign key) si elle n'existe pas
SET @exist := (SELECT COUNT(*) FROM information_schema.columns 
               WHERE table_schema = DATABASE() 
               AND table_name = 'students' 
               AND column_name = 'groupId');

SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE students ADD COLUMN groupId INT NULL AFTER matricule', 'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Ajouter la contrainte de clé étrangère
SET @exist := (SELECT COUNT(*) FROM information_schema.table_constraints 
               WHERE table_schema = DATABASE() 
               AND table_name = 'students' 
               AND constraint_name = 'students_groupId_foreign_idx');

SET @sqlstmt := IF(@exist = 0, 
    'ALTER TABLE students ADD CONSTRAINT students_groupId_foreign_idx FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE SET NULL ON UPDATE CASCADE', 
    'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. Créer un index sur groupId pour améliorer les performances
SET @exist := (SELECT COUNT(*) FROM information_schema.statistics 
               WHERE table_schema = DATABASE() 
               AND table_name = 'students' 
               AND index_name = 'students_groupId_idx');

SET @sqlstmt := IF(@exist = 0, 'CREATE INDEX students_groupId_idx ON students(groupId)', 'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Message de confirmation
SELECT 'Migration 001_add_groups terminée avec succès' AS message;
