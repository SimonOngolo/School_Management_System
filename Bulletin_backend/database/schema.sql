-- Création de la base de données
CREATE DATABASE IF NOT EXISTS bulletins_asur;
USE bulletins_asur;

-- Table des semestres
CREATE TABLE IF NOT EXISTS semesters (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  code VARCHAR(255) NOT NULL UNIQUE,
  totalCredits INT DEFAULT 30,
  academicYear VARCHAR(255),
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);

-- Table des UE
CREATE TABLE IF NOT EXISTS ues (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  coefficient DECIMAL(5,2) DEFAULT 1,
  semesterId INT,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (semesterId) REFERENCES semesters(id)
);

-- Table des matières
CREATE TABLE IF NOT EXISTS subjects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  coefficient DECIMAL(5,2) NOT NULL DEFAULT 1,
  credits INT NOT NULL DEFAULT 0,
  ueId INT,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (ueId) REFERENCES ues(id)
);

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'teacher', 'secretariat', 'student') NOT NULL DEFAULT 'student',
  firstName VARCHAR(255) NOT NULL,
  lastName VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);

-- Table des étudiants
CREATE TABLE IF NOT EXISTS students (
  id INT PRIMARY KEY AUTO_INCREMENT,
  matricule VARCHAR(255) NOT NULL UNIQUE,
  firstName VARCHAR(255) NOT NULL,
  lastName VARCHAR(255) NOT NULL,
  birthDate DATE,
  birthPlace VARCHAR(255),
  bacType VARCHAR(255),
  originSchool VARCHAR(255),
  userId INT,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Table des notes
CREATE TABLE IF NOT EXISTS grades (
  id INT PRIMARY KEY AUTO_INCREMENT,
  studentId INT NOT NULL,
  subjectId INT NOT NULL,
  type ENUM('CC', 'EXAM', 'RATTRAPAGE') NOT NULL,
  value DECIMAL(5,2),
  dateRecorded DATETIME DEFAULT NOW(),
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (studentId) REFERENCES students(id),
  FOREIGN KEY (subjectId) REFERENCES subjects(id),
  UNIQUE KEY unique_grade (studentId, subjectId, type)
);

-- Table des absences
CREATE TABLE IF NOT EXISTS absences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  studentId INT NOT NULL,
  subjectId INT NOT NULL,
  hours DECIMAL(5,2) DEFAULT 0,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (studentId) REFERENCES students(id),
  FOREIGN KEY (subjectId) REFERENCES subjects(id)
);

-- Table des résultats par matière
CREATE TABLE IF NOT EXISTS subject_results (
  id INT PRIMARY KEY AUTO_INCREMENT,
  studentId INT NOT NULL,
  subjectId INT NOT NULL,
  average DECIMAL(5,2),
  rattrapageUsed BOOLEAN DEFAULT FALSE,
  penaltyApplied DECIMAL(5,2) DEFAULT 0,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (studentId) REFERENCES students(id),
  FOREIGN KEY (subjectId) REFERENCES subjects(id)
);

-- Table des résultats par UE
CREATE TABLE IF NOT EXISTS ue_results (
  id INT PRIMARY KEY AUTO_INCREMENT,
  studentId INT NOT NULL,
  ueId INT NOT NULL,
  average DECIMAL(5,2),
  creditsAcquired INT DEFAULT 0,
  isCompensated BOOLEAN DEFAULT FALSE,
  isValidated BOOLEAN DEFAULT FALSE,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (studentId) REFERENCES students(id),
  FOREIGN KEY (ueId) REFERENCES ues(id)
);

-- Table des résultats par semestre
CREATE TABLE IF NOT EXISTS semester_results (
  id INT PRIMARY KEY AUTO_INCREMENT,
  studentId INT NOT NULL,
  semesterId INT NOT NULL,
  average DECIMAL(5,2),
  totalCredits INT DEFAULT 0,
  isValidated BOOLEAN DEFAULT FALSE,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (studentId) REFERENCES students(id),
  FOREIGN KEY (semesterId) REFERENCES semesters(id)
);

-- Table des résultats annuels (Fixed ENUM syntax for mention)
CREATE TABLE IF NOT EXISTS annual_results (
  id INT PRIMARY KEY AUTO_INCREMENT,
  studentId INT NOT NULL,
  academicYear VARCHAR(255) NOT NULL,
  average DECIMAL(5,2),
  totalCredits INT DEFAULT 0,
  decision ENUM('DIPLÔMÉ', 'REPRISE_SOUTENANCE', 'REDOUBLE', 'NON_DIPLÔMÉ') DEFAULT 'NON_DIPLÔMÉ',
  mention ENUM('PASSABLE', 'ASSEZ_BIEN', 'BIEN', 'TRÈS_BIEN') DEFAULT NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (studentId) REFERENCES students(id)
);

-- Table des logs d'audit
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  action VARCHAR(255) NOT NULL,
  entityType VARCHAR(255),
  entityId INT,
  oldValues TEXT,
  newValues TEXT,
  ipAddress VARCHAR(255),
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Insertion des semestres
INSERT INTO semesters (id, name, code, totalCredits, academicYear, createdAt, updatedAt) VALUES
(1, 'Semestre 5', 'S5', 30, '2024-2025', NOW(), NOW()),
(2, 'Semestre 6', 'S6', 30, '2024-2025', NOW(), NOW());

-- Insertion des UE pour S5
INSERT INTO ues (id, code, name, coefficient, semesterId, createdAt, updatedAt) VALUES
(1, 'UE5-1', 'Enseignement Général', 1, 1, NOW(), NOW()),
(2, 'UE5-2', 'Connaissances de Base et Outils pour les Réseaux', 1, 1, NOW(), NOW());

-- Insertion des matières pour S5
INSERT INTO subjects (id, name, coefficient, credits, ueId, createdAt, updatedAt) VALUES
(1, 'Anglais technique', 1, 2, 1, NOW(), NOW()),
(2, "Management d'équipe", 1, 1, 1, NOW(), NOW()),
(3, 'Communication', 2, 1, 1, NOW(), NOW()),
(4, "Droit de l'informatique", 2, 2, 1, NOW(), NOW()),
(5, 'Gestion de projets', 1, 1, 1, NOW(), NOW()),
(6, 'Veille technologique', 1, 1, 1, NOW(), NOW()),
(7, 'Consolidation bases de la programmation', 2, 2, 1, NOW(), NOW()),
(8, 'Conception BDD et SQL', 2, 2, 1, NOW(), NOW()),
(9, 'Remise à niveau IOS', 2, 2, 2, NOW(), NOW()),
(10, 'Connaissance des réseaux LAN', 2, 2, 2, NOW(), NOW()),
(11, 'Les langages du script', 2, 2, 2, NOW(), NOW()),
(12, 'Virtualisation', 3, 3, 2, NOW(), NOW()),
(13, 'Application client-serveur', 2, 2, 2, NOW(), NOW()),
(14, 'Téléphonie IP avancée', 2, 2, 2, NOW(), NOW()),
(15, 'Services à valeur ajoutée', 2, 2, 2, NOW(), NOW()),
(16, 'CCNA2', 1, 2, 2, NOW(), NOW());

-- Insertion des UE pour S6
INSERT INTO ues (id, code, name, coefficient, semesterId, createdAt, updatedAt) VALUES
(3, 'UE6-1', 'Sciences de Base', 1, 2, NOW(), NOW()),
(4, 'UE6-2', 'Télécommunications et Réseaux', 1, 2, NOW(), NOW());

-- Insertion des matières pour S6
INSERT INTO subjects (id, name, coefficient, credits, ueId, createdAt, updatedAt) VALUES
(17, 'Environnement Windows', 3, 3, 3, NOW(), NOW()),
(18, 'Environnement Linux', 3, 3, 3, NOW(), NOW()),
(19, 'Interopérabilité', 3, 3, 3, NOW(), NOW()),
(20, 'Cryptage et Authentification', 2, 2, 3, NOW(), NOW()),
(21, 'Prévention et Sécurité', 3, 3, 3, NOW(), NOW()),
(22, "Optimisation de l'accès Internet", 3, 3, 3, NOW(), NOW()),
(23, "Contrôle d'accès distant", 2, 2, 3, NOW(), NOW()),
(24, 'CCNA3', 1, 1, 3, NOW(), NOW()),
(25, 'Méthodologie de rédaction du rapport de stage', 2, 2, 4, NOW(), NOW()),
(26, 'Soutenance', 8, 8, 4, NOW(), NOW());

-- Utilisateur admin par défaut (mot de passe: 123admin)
INSERT INTO users (id, email, password, role, firstName, lastName, active, createdAt, updatedAt) VALUES
(1, 'admin@inptic.ga', '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.J3jxRqZQqQqQqQqQqQqQqQqQ', 'admin', 'Administrateur', 'Principal', 1, NOW(), NOW());