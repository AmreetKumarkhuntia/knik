-- Weekday and "everyday" schedules ("every Monday at 2pm", "everyday at 9am") used to be stored without a
-- recurrence, and the scheduler now runs a schedule without one once and then disables it. Give them the
-- weekly or daily recurrence their description asks for, the same patterns the parser now recognises.
-- Safe to re-run: only schedules that still have no recurrence are touched.

UPDATE schedules
SET recurrence_seconds = 604800
WHERE recurrence_seconds IS NULL
  AND schedule_description ~* 'every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)';

UPDATE schedules
SET recurrence_seconds = 86400
WHERE recurrence_seconds IS NULL
  AND schedule_description ~* 'everyday';
