-- Marks announcements that should remain visible in the student's reduced-distraction view.
alter table public.class_announcements
  add column if not exists is_important boolean not null default false;

create index if not exists class_announcements_important_idx
  on public.class_announcements (class_id, created_at desc)
  where is_important = true;
