-- The Biblioteca is reserved for explicitly uploaded study materials.
-- Existing EXAM/ACTIVITY/LESSON_PLAN rows are preserved for history/export,
-- but are no longer generated or exposed as Biblioteca entries.

drop trigger if exists exams_sync_material on public.exams;
drop trigger if exists activities_sync_material on public.activities;
drop trigger if exists lesson_plans_sync_material on public.lesson_plans;

drop function if exists public.sync_exam_material();
drop function if exists public.sync_activity_material();
drop function if exists public.sync_lesson_plan_material();
