export type StudyStreak = { currentStreak: number; dailyGoal: number; completedToday: number; goalCompleted: boolean; hasHistory: boolean };

function dayKey(value: string | Date): string {
  return typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10);
}

export function calculateStudyStreak(eventDates: string[], today = dayKey(new Date()), dailyGoal = 1): StudyStreak {
  const days = new Set(eventDates.map(dayKey));
  const completedToday = eventDates.filter((date) => dayKey(date) === today).length;
  let currentStreak = 0;
  if (days.has(today)) {
    const cursor = new Date(`${today}T00:00:00Z`);
    while (days.has(dayKey(cursor))) {
      currentStreak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
  }
  return { currentStreak, dailyGoal, completedToday, goalCompleted: completedToday >= dailyGoal, hasHistory: days.size > 0 };
}
