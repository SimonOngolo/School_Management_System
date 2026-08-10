-- Migration 003: Fix duplicate result records and add unique constraints
-- This prevents multiple results for the same student/subject/ue/semester/year combination

-- ============================================
-- 1. SUBJECT_RESULTS (studentId + subjectId)
-- ============================================

-- Create temp table with latest results
CREATE TEMPORARY TABLE IF NOT EXISTS temp_subject_results AS
SELECT sr1.*
FROM subject_results sr1
INNER JOIN (
    SELECT studentId, subjectId, MAX(id) as maxId
    FROM subject_results
    GROUP BY studentId, subjectId
) sr2 ON sr1.studentId = sr2.studentId 
    AND sr1.subjectId = sr2.subjectId 
    AND sr1.id = sr2.maxId;

-- Delete duplicates
DELETE FROM subject_results;

-- Re-insert unique records
INSERT INTO subject_results (id, studentId, subjectId, average, rattrapageUsed, penaltyApplied, createdAt, updatedAt)
SELECT id, studentId, subjectId, average, rattrapageUsed, penaltyApplied, createdAt, updatedAt
FROM temp_subject_results;

-- Add unique constraint
ALTER TABLE subject_results 
ADD UNIQUE KEY IF NOT EXISTS unique_student_subject (studentId, subjectId);

DROP TEMPORARY TABLE IF EXISTS temp_subject_results;

-- ============================================
-- 2. UE_RESULTS (studentId + ueId)
-- ============================================

CREATE TEMPORARY TABLE IF NOT EXISTS temp_ue_results AS
SELECT ur1.*
FROM ue_results ur1
INNER JOIN (
    SELECT studentId, ueId, MAX(id) as maxId
    FROM ue_results
    GROUP BY studentId, ueId
) ur2 ON ur1.studentId = ur2.studentId 
    AND ur1.ueId = ur2.ueId 
    AND ur1.id = ur2.maxId;

DELETE FROM ue_results;

INSERT INTO ue_results (id, studentId, ueId, average, creditsAcquired, isCompensated, isValidated, createdAt, updatedAt)
SELECT id, studentId, ueId, average, creditsAcquired, isCompensated, isValidated, createdAt, updatedAt
FROM temp_ue_results;

ALTER TABLE ue_results 
ADD UNIQUE KEY IF NOT EXISTS unique_student_ue (studentId, ueId);

DROP TEMPORARY TABLE IF EXISTS temp_ue_results;

-- ============================================
-- 3. SEMESTER_RESULTS (studentId + semesterId)
-- ============================================

CREATE TEMPORARY TABLE IF NOT EXISTS temp_semester_results AS
SELECT sr1.*
FROM semester_results sr1
INNER JOIN (
    SELECT studentId, semesterId, MAX(id) as maxId
    FROM semester_results
    GROUP BY studentId, semesterId
) sr2 ON sr1.studentId = sr2.studentId 
    AND sr1.semesterId = sr2.semesterId 
    AND sr1.id = sr2.maxId;

DELETE FROM semester_results;

INSERT INTO semester_results (id, studentId, semesterId, average, totalCredits, isValidated, createdAt, updatedAt)
SELECT id, studentId, semesterId, average, totalCredits, isValidated, createdAt, updatedAt
FROM temp_semester_results;

ALTER TABLE semester_results 
ADD UNIQUE KEY IF NOT EXISTS unique_student_semester (studentId, semesterId);

DROP TEMPORARY TABLE IF EXISTS temp_semester_results;

-- ============================================
-- 4. ANNUAL_RESULTS (studentId + academicYear)
-- ============================================

CREATE TEMPORARY TABLE IF NOT EXISTS temp_annual_results AS
SELECT ar1.*
FROM annual_results ar1
INNER JOIN (
    SELECT studentId, academicYear, MAX(id) as maxId
    FROM annual_results
    GROUP BY studentId, academicYear
) ar2 ON ar1.studentId = ar2.studentId 
    AND ar1.academicYear = ar2.academicYear 
    AND ar1.id = ar2.maxId;

DELETE FROM annual_results;

INSERT INTO annual_results (id, studentId, academicYear, average, totalCredits, decision, mention, createdAt, updatedAt)
SELECT id, studentId, academicYear, average, totalCredits, decision, mention, createdAt, updatedAt
FROM temp_annual_results;

ALTER TABLE annual_results 
ADD UNIQUE KEY IF NOT EXISTS unique_student_year (studentId, academicYear);

DROP TEMPORARY TABLE IF EXISTS temp_annual_results;
