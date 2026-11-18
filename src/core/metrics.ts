import type { DayRecord } from './types';
import { dayRandom, jitter, randInt, type Rand } from './random';

/** 参考图反推：258 kcal / 8742 步 */
export const KCAL_PER_STEP = 0.0295;
/** 参考图反推：6.24 km / 8742 步 */
export const METERS_PER_STEP = 0.714;

export const CALORIES_GOAL = 240;
export const EXERCISE_GOAL = 25;
export const ACTIVE_HOURS_GOAL = 6;

/** 24 小时活动权重：凌晨几乎为 0，早晚通勤与午间是高峰。 */
const HOUR_WEIGHTS = [
  0.15, 0.08, 0.06, 0.05, 0.06, 0.25, 1.4, 6.5, 8.5, 4.2, 2.6, 3.2,
  7.2, 4.4, 2.6, 2.4, 3.0, 6.2, 8.0, 5.0, 2.6, 1.5, 0.7, 0.3,
];

function largestRemainder(weights: number[], total: number): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => (total * w) / sum);
  const floors = raw.map((v) => Math.floor(v));
  let rest = total - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  const out = floors.slice();
  for (let k = 0; k < rest; k += 1) out[order[k % order.length].i] += 1;
  return out;
}

/** 把当天步数摊到 24 小时，保证总和精确等于 steps。 */
export function splitHourly(steps: number, rand: Rand): number[] {
  const weights = HOUR_WEIGHTS.map((w) => w * jitter(rand, 0.22));
  return largestRemainder(weights, steps);
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * 生成某一天的全部数据。
 * @param date 本地日期 YYYY-MM-DD
 * @param steps 当天步数
 * @param goal 目标步数
 * @param seed 主种子（同一天同 seed 结果稳定）
 */
export function buildDayRecord(
  date: string,
  steps: number,
  goal: number,
  seed: number,
  now: Date = new Date(),
): DayRecord {
  const rand = dayRandom(seed, date);
  const hourly = splitHourly(steps, rand);
  const calories = Math.round(steps * KCAL_PER_STEP * jitter(rand, 0.08));
  const distanceKm =
    Math.round(((steps * METERS_PER_STEP) / 1000) * jitter(rand, 0.08) * 100) / 100;

  const activeHours = Math.min(
    ACTIVE_HOURS_GOAL,
    hourly.filter((v) => v >= 200).length,
  );
  const exerciseMinutes = Math.min(60, Math.round(steps / 700));

  const sleepH = randInt(rand, 5, 8);
  const sleepM = randInt(rand, 0, 59);
  const heartRate = randInt(rand, 88, 118);
  const fatLossKg = randInt(rand, 3, 8);
  const workoutKm = Math.round(randInt(rand, 30, 800) / 100);
  const bedH = randInt(rand, 22, 24);

  // 状态栏时间：今天这一页不能晚于「生成时刻」，其余日期随便取白天时间
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const isToday = date === `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  const clockMinutes = isToday
    ? randInt(rand, Math.max(0, nowMinutes - 8 * 60), nowMinutes)
    : randInt(rand, 8 * 60, 21 * 60 + 59);

  return {
    date,
    seed,
    steps,
    goal,
    calories,
    caloriesGoal: CALORIES_GOAL,
    distanceKm,
    hourly,
    activeHours,
    activeHoursGoal: ACTIVE_HOURS_GOAL,
    exerciseMinutes,
    exerciseGoal: EXERCISE_GOAL,
    workoutKm,
    sleepText: `${sleepH}小时${pad2(sleepM)}分`,
    heartRate,
    fatLossKg,
    bedTime: `${pad2(bedH % 24)}:${pad2(randInt(rand, 0, 1) * 30)}`,
    clock: `${pad2(Math.floor(clockMinutes / 60))}:${pad2(clockMinutes % 60)}`,
    battery: randInt(rand, 85, 99),
  };
}

/** 步数 → 热量（不经随机，用于展示公式与测试）。 */
export function caloriesOf(steps: number): number {
  return Math.round(steps * KCAL_PER_STEP);
}

export function distanceOf(steps: number): number {
  return Math.round(((steps * METERS_PER_STEP) / 1000) * 100) / 100;
}
