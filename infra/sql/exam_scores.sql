-- Exam scores per student per exam to enable class results averaging
-- Simplified schema; can be extended later for subject-level granularity.

CREATE TABLE IF NOT EXISTS exam_scores (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  exam_date date NOT NULL,
  exam_type text NOT NULL DEFAULT 'term',
  total_marks INT NOT NULL,
  obtained_marks INT NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(student_id, exam_date, exam_type)
);

-- Index to accelerate range queries for recent exam windows
CREATE INDEX IF NOT EXISTS ix_exam_scores_date ON exam_scores(exam_date);

-- View (optional) for latest exam per student (term type)
CREATE OR REPLACE VIEW latest_exam_score AS
SELECT DISTINCT ON (student_id)
  student_id,
  exam_date,
  exam_type,
  total_marks,
  obtained_marks
FROM exam_scores
WHERE exam_type='term'
ORDER BY student_id, exam_date DESC;
