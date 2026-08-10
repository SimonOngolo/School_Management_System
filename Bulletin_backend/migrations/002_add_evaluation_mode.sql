-- Migration 002: Add evaluationMode column to subjects table
-- This allows specifying how each subject should be evaluated:
-- MIXTE: Requires both CC and EXAM (default)
-- EXAM_ONLY: Only exam grade is needed
-- CC_ONLY: Only CC grade is needed

ALTER TABLE subjects 
ADD COLUMN evaluationMode ENUM('MIXTE', 'EXAM_ONLY', 'CC_ONLY') NOT NULL DEFAULT 'MIXTE';

-- Add comment explaining the column
ALTER TABLE subjects 
MODIFY COLUMN evaluationMode ENUM('MIXTE', 'EXAM_ONLY', 'CC_ONLY') 
NOT NULL DEFAULT 'MIXTE' 
COMMENT 'Mode d evaluation: MIXTE (CC+EXAM), EXAM_ONLY, ou CC_ONLY';
