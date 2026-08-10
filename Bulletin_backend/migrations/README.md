# Migrations Base de Données

## Migration 001: Ajout du système de Groupes

### Fichier: `001_add_groups.sql`

Cette migration crée le système de groupes/classes pour gérer plusieurs promotions (ASUR1, ASUR2, etc.) par année académique.

### Changements apportés:

1. **Nouvelle table `groups`**:
   - `id`: Identifiant unique
   - `name`: Nom du groupe (ex: "ASUR1", "ASUR2")
   - `academicYear`: Année académique (ex: "2024-2025")
   - Contrainte d'unicité sur (name, academicYear)

2. **Modification table `students`**:
   - Suppression de l'ancienne colonne `group` (STRING)
   - Ajout de `groupId` (INT, clé étrangère vers groups.id)
   - Index pour améliorer les performances

### Comment exécuter:

```bash
# Se connecter à MySQL
mysql -u root -p your_database_name < migrations/001_add_groups.sql

# Ou avec un client MySQL
source migrations/001_add_groups.sql;
```

### Vérification:

```sql
-- Vérifier que la table groups existe
SHOW TABLES LIKE 'groups';

-- Vérifier la structure de students
DESCRIBE students;

-- Vérifier les clés étrangères
SELECT * FROM information_schema.table_constraints 
WHERE table_name = 'students' AND constraint_type = 'FOREIGN KEY';
```
