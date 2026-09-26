/**
 * Helper to determine the most recent modification timestamp of an entity.
 * Supports updatedAt, timeline interaction IDs (e.g. tl-1727...), interaction dates,
 * createdAt, and dateAdded.
 */
export function getEntityTimestamp(entity: any): number {
  if (!entity) return 0;

  // 1. Explicit updatedAt ISO string or number
  if (entity.updatedAt) {
    const t = new Date(entity.updatedAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }

  // 2. Timeline interactions with tl-timestamp IDs or ISO date strings
  if (Array.isArray(entity.timeline) && entity.timeline.length > 0) {
    const interactionTimes = entity.timeline.map((t: any) => {
      if (!t) return 0;
      if (t.id && typeof t.id === 'string' && t.id.startsWith('tl-')) {
        const num = parseInt(t.id.replace('tl-', ''), 10);
        if (!isNaN(num) && num > 0) return num;
      }
      if (t.date) {
        const d = new Date(t.date).getTime();
        if (!isNaN(d) && d > 0) return d;
      }
      return 0;
    });
    const maxTimelineTime = Math.max(...interactionTimes);
    if (maxTimelineTime > 0) return maxTimelineTime;
  }

  // 3. Entity creation or added date
  if (entity.createdAt) {
    const t = new Date(entity.createdAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (entity.dateAdded) {
    const t = new Date(entity.dateAdded).getTime();
    if (!isNaN(t) && t > 0) return t;
  }

  return 0;
}
