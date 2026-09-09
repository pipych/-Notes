import { Note, GroupedNotes } from '../types';

export const DATE_CATEGORIES = [
  { name: 'TODAY', title: 'Сегодня', order: 1 },
  { name: 'YESTERDAY', title: 'Вчера', order: 2 },
  { name: 'LAST_7_DAYS', title: 'Предыдущие 7 дней', order: 3 },
  { name: 'LAST_30_DAYS', title: 'Предыдущие 30 дней', order: 4 },
  { name: 'EARLIER', title: 'Ранее', order: 5 },
] as const;

export function getNoteTimestamp(dateVal: string | number): number {
  if (typeof dateVal === 'number') return dateVal;
  const parsed = Date.parse(dateVal);
  return isNaN(parsed) ? Date.now() : parsed;
}

export function formatDisplayDate(dateVal: string | number): string {
  const ts = getNoteTimestamp(dateVal);
  const d = new Date(ts);
  const months = ['янв', 'февр', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сент', 'окт', 'нояб', 'дек'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

export function getDateCategory(epochMillis: number): typeof DATE_CATEGORIES[number] {
  const now = new Date();
  const noteDate = new Date(epochMillis);

  // Strip time for day comparison
  const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const noteDateOnly = new Date(noteDate.getFullYear(), noteDate.getMonth(), noteDate.getDate()).getTime();

  const diffDays = Math.round((nowDateOnly - noteDateOnly) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return DATE_CATEGORIES[0]; // TODAY
  if (diffDays === 1) return DATE_CATEGORIES[1]; // YESTERDAY
  if (diffDays <= 7) return DATE_CATEGORIES[2]; // LAST_7_DAYS
  if (diffDays <= 30) return DATE_CATEGORIES[3]; // LAST_30_DAYS
  return DATE_CATEGORIES[4]; // EARLIER
}

export function groupNotesByDate(notes: Note[]): GroupedNotes[] {
  const groupsMap = new Map<string, Note[]>();

  DATE_CATEGORIES.forEach(cat => groupsMap.set(cat.name, []));

  notes.forEach(note => {
    const ts = getNoteTimestamp(note.updated_at || note.created_at);
    const cat = getDateCategory(ts);
    groupsMap.get(cat.name)?.push(note);
  });

  const result: GroupedNotes[] = [];
  DATE_CATEGORIES.forEach(cat => {
    const list = groupsMap.get(cat.name) || [];
    if (list.length > 0) {
      result.push({
        category: cat,
        notes: list,
      });
    }
  });

  return result;
}
