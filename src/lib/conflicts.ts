export interface SchedulableItem {
  id: string;
  startAt: Date | null;
  endAt: Date | null;
}

/**
 * Returns the ids of items that overlap another item in time. Only items with
 * both a start and an end participate; the result is surfaced as a warning,
 * never a hard block.
 */
export function detectConflicts(items: SchedulableItem[]): Set<string> {
  const ranged = items.filter(
    (i): i is { id: string; startAt: Date; endAt: Date } =>
      i.startAt !== null && i.endAt !== null,
  );
  const conflicting = new Set<string>();
  for (let i = 0; i < ranged.length; i++) {
    for (let j = i + 1; j < ranged.length; j++) {
      const a = ranged[i];
      const b = ranged[j];
      if (a.startAt < b.endAt && b.startAt < a.endAt) {
        conflicting.add(a.id);
        conflicting.add(b.id);
      }
    }
  }
  return conflicting;
}
