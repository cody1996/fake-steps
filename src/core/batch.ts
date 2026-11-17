import type { BatchOptions, ScheduledDay } from './types';
import { buildDayRecord } from './metrics';
import { dayRandom, randInt } from './random';

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDays(s: string, n: number): string {
  const d = parseISODate(s);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

/** 枚举 [start, end] 之间的所有日期（含两端）。 */
export function enumerateDates(start: string, end: string): string[] {
  if (!start || !end) return [];
  let a = start;
  let b = end;
  if (a > b) [a, b] = [b, a];
  const out: string[] = [];
  let cur = a;
  let guard = 0;
  while (cur <= b && guard < 1000) {
    out.push(cur);
    cur = addDays(cur, 1);
    guard += 1;
  }
  return out;
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export function monthDayLabel(iso: string): string {
  const d = parseISODate(iso);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export function weekdayLabel(iso: string): string {
  return WEEKDAYS[parseISODate(iso).getDay()];
}

export function formatInt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

/** 按日期范围生成整批截图数据。 */
export function buildBatch(opts: BatchOptions): ScheduledDay[] {
  const min = Math.max(0, Math.min(opts.minSteps, opts.maxSteps));
  const max = Math.max(min, Math.max(opts.minSteps, opts.maxSteps));
  return enumerateDates(opts.start, opts.end).map((date) => {
    const rand = dayRandom(opts.seed + 7919, date);
    const steps = randInt(rand, min, max);
    return {
      record: buildDayRecord(date, steps, opts.goal, opts.seed),
      template: date === opts.today ? 'today' : 'history',
    };
  });
}
