import type { DayRecord } from '../core/types';

/** 与参考截图逐项对齐的「标本数据」，用于像素校准；不参与真实生成。 */
export const REF_HISTORY: DayRecord = {
  date: '2026-04-10',
  seed: 20260410,
  steps: 8742,
  goal: 10000,
  calories: 258,
  caloriesGoal: 240,
  distanceKm: 6.24,
  hourly: [
    0, 0, 0, 0, 0, 0, 0, 120, 520, 1400, 220, 1500, 260, 140, 60, 30,
    1180, 1400, 1520, 60, 90, 190, 40, 20,
  ],
  activeHours: 4,
  activeHoursGoal: 6,
  exerciseMinutes: 12,
  exerciseGoal: 25,
  workoutKm: 0.42,
  sleepText: '5小时41分',
  heartRate: 104,
  fatLossKg: 5,
  bedTime: '23:00',
  clock: '15:22',
  battery: 89,
};

export const REF_TODAY: DayRecord = {
  ...REF_HISTORY,
  steps: 282,
  calories: 8,
  distanceKm: 0.2,
  workoutKm: 0.42,
  activeHours: 0,
  exerciseMinutes: 0,
  clock: '15:20',
  battery: 90,
  hourly: [0, 0, 0, 0, 0, 0, 0, 0, 0, 40, 0, 0, 0, 0, 0, 0, 0, 60, 0, 0, 0, 0, 0, 180],
};

/** 进度弧演示数据：三项指标都接近完成，用来核对环的进度显示 */
export const DEMO_TODAY: DayRecord = {
  ...REF_TODAY,
  steps: 6180,
  calories: 214,
  exerciseMinutes: 19,
  activeHours: 5,
  workoutKm: 2.35,
};

export interface CaptureState {
  kind: 'today' | 'history';
  record: DayRecord;
}

/** ?capture=today|history 时进入截图模式，用于自动化像素对比。 */
export function useCapture(): CaptureState | null {
  if (typeof location === 'undefined') return null;
  const params = new URLSearchParams(location.search);
  const kind = params.get('capture');
  if (kind !== 'today' && kind !== 'history') return null;
  const demo = params.get('demo') === '1';
  return { kind, record: kind === 'today' ? (demo ? DEMO_TODAY : REF_TODAY) : REF_HISTORY };
}
