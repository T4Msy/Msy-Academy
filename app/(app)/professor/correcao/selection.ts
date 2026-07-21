export function toggleSubmissionSelection(selected: Set<string>, submissionId: string): Set<string> {
  const next = new Set(selected);
  if (next.has(submissionId)) next.delete(submissionId);
  else next.add(submissionId);
  return next;
}

export function selectVisibleSubmissions(selected: Set<string>, visibleIds: string[], select: boolean): Set<string> {
  const next = new Set(selected);
  visibleIds.forEach((id) => (select ? next.add(id) : next.delete(id)));
  return next;
}
