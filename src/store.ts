import content from './content.json';
export type Item = any;
export const LESSON = (content as any).lesson;
export const ITEMS: Item[] = (content as any).items;
export const byId = (id: string) => ITEMS.find(i => i.id === id)!;
export const isQuiz = (i: Item) => i.type !== 'rule_card';

const KEY = 'resipsa.v1';
const INTERVALS = [0, 1, 3, 7, 16, 35]; // Leitner box -> days
export type Card = { box: number; due: string; seen: number; misses: number; correct: number };
export type Stop = { id: string; items: string[]; done: boolean };
export type State = {
  xp: number; streak: number; lastRoundDay: string | null; stamps: string[];
  cards: Record<string, Card>; round: { day: string; stops: Stop[]; bonus: boolean } | null;
  notify: string[]; xpToday: { day: string; xp: number };
};
export const today = (d = new Date()) => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); };
const addDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return today(d); };
const fresh = (): State => ({ xp: 0, streak: 0, lastRoundDay: null, stamps: [], cards: {}, round: null, notify: [], xpToday: { day: today(), xp: 0 } });
export function load(): State { try { const s = JSON.parse(localStorage.getItem(KEY) || ''); return { ...fresh(), ...s }; } catch { return fresh(); } }
export function save(s: State) { localStorage.setItem(KEY, JSON.stringify(s)); }
export function reset() { localStorage.removeItem(KEY); }

export const RANKS = [[0, '1L'], [150, '2L'], [400, '3L'], [800, 'Bar Applicant'], [1300, 'Associate'], [2000, 'Partner'], [3000, 'Magistrate'], [4500, 'Judge'], [6500, 'Supreme Court']] as const;
export function rank(xp: number) { let i = 0; RANKS.forEach((r, j) => { if (xp >= r[0]) i = j; }); return { name: RANKS[i][1], next: RANKS[i + 1]?.[0] ?? null, floor: RANKS[i][0] }; }

export function grade(s: State, id: string, ok: boolean): State {
  const c: Card = s.cards[id] ?? { box: 0, due: today(), seen: 0, misses: 0, correct: 0 };
  const box = ok ? Math.min(c.box + 1, INTERVALS.length - 1) : 1;
  const n: Card = { box, due: addDays(ok ? INTERVALS[box] : 0), seen: c.seen + 1, misses: c.misses + (ok ? 0 : 1), correct: c.correct + (ok ? 1 : 0) };
  return { ...s, cards: { ...s.cards, [id]: n } };
}
export function addXp(s: State, n: number): State {
  const t = s.xpToday.day === today() ? s.xpToday.xp : 0;
  return { ...s, xp: s.xp + n, xpToday: { day: today(), xp: t + n } };
}

export const BUILDINGS = [
  { id: 'hall', name: 'Practice Hall', sub: 'Rule cards & fill-ins', x: 85, y: 205, mx: 60, my: 200, types: ['rule_card', 'fill_blank'] },
  { id: 'plaza', name: 'Integrated Sets Plaza', sub: 'MBE-style case files', x: 282, y: 205, mx: 300, my: 200, types: ['mcq'] },
  { id: 'library', name: 'Research Library', sub: 'Your weak spots', x: 85, y: 395, mx: 62, my: 380, types: ['weak'] },
  { id: 'station', name: 'Exam Day Station', sub: 'Speed round & boss', x: 278, y: 390, mx: 300, my: 376, types: ['true_false', 'boss'] },
] as const;

/** Build today's ~10 min round: due reviews + new items + weak-area questions, split across 4 stops. */
export function buildRound(s: State) {
  const t = today();
  const seen = (i: Item) => !!s.cards[i.id];
  const due = ITEMS.filter(i => seen(i) && isQuiz(i) && s.cards[i.id].due <= t).sort((a, b) => s.cards[a.id].box - s.cards[b.id].box);
  const fresh = ITEMS.filter(i => !seen(i));
  const weak = ITEMS.filter(i => isQuiz(i) && seen(i) && s.cards[i.id].misses > 0).sort((a, b) => (s.cards[b.id].misses / s.cards[b.id].seen) - (s.cards[a.id].misses / s.cards[a.id].seen));
  const used = new Set<string>();
  const take = (arr: Item[], n: number, pred: (i: Item) => boolean = () => true) => { const out: string[] = []; for (const i of arr) { if (out.length >= n) break; if (!used.has(i.id) && pred(i)) { used.add(i.id); out.push(i.id); } } return out; };
  // stop 1 Practice Hall: due reviews of rules/fill-ins, then new rule cards + matching fill-ins
  const hall = [...take(due, 2, i => i.type === 'fill_blank'), ...take(fresh, 3, i => i.type === 'rule_card'), ...take(fresh, 3, i => i.type === 'fill_blank')];
  const plaza = [...take(due, 1, i => i.type === 'mcq'), ...take(fresh, 3, i => i.type === 'mcq')];
  let library = take(weak, 3);
  if (library.length < 2) library = [...library, ...take(due, 3 - library.length), ...take([...ITEMS].filter(i => isQuiz(i)).sort(() => Math.random() - .5), 2 - library.length)];
  const tf = ITEMS.filter(i => i.type === 'true_false');
  const bossReady = ITEMS.filter(i => i.type === 'mcq').every(seen) || ITEMS.filter(i => i.type === 'mcq').filter(i => !used.has(i.id) && !seen(i)).length === 0;
  const station = [...take(due, 1, i => i.type === 'true_false'), ...take(tf, 3 - 0), ...(bossReady ? take(ITEMS, 1, i => i.type === 'boss') : [])];
  const fill = (a: string[], pool: Item[]) => a.length ? a : take(pool, 2);
  return { day: t, bonus: false, stops: [
    { id: 'hall', items: fill(hall, ITEMS.filter(i => i.type === 'fill_blank')), done: false },
    { id: 'plaza', items: fill(plaza, ITEMS.filter(i => i.type === 'mcq')), done: false },
    { id: 'library', items: fill(library, ITEMS.filter(isQuiz)), done: false },
    { id: 'station', items: fill(station, tf), done: false },
  ] };
}
export function ensureRound(s: State): State {
  let n = s;
  // streak breaks if a full day was missed
  if (s.lastRoundDay && s.lastRoundDay < addDays(-1) && s.streak) n = { ...n, streak: 0 };
  if (!s.round || s.round.day !== today()) n = { ...n, round: buildRound(n) };
  return n;
}
export function freePlay(s: State, b: string): string[] {
  const t = today();
  if (b === 'library') { const w = ITEMS.filter(i => isQuiz(i) && s.cards[i.id] && (s.cards[i.id].misses > 0 || s.cards[i.id].due <= t)); return (w.length ? w : ITEMS.filter(isQuiz).sort(() => Math.random() - .5).slice(0, 6)).map(i => i.id); }
  const B = BUILDINGS.find(x => x.id === b)!;
  return ITEMS.filter(i => (B.types as readonly string[]).includes(i.type)).map(i => i.id);
}
