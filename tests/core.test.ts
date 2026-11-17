import { describe, expect, it } from 'vitest';
import {
  KCAL_PER_STEP,
  METERS_PER_STEP,
  buildDayRecord,
  splitHourly,
} from '../src/core/metrics';
import { mulberry32 } from '../src/core/random';
import { makeTrace } from '../src/core/trace';
import {
  buildBatch,
  enumerateDates,
  formatInt,
  monthDayLabel,
  weekdayLabel,
} from '../src/core/batch';

describe('24 小时分布', () => {
  it('总和精确等于步数', () => {
    for (const steps of [0, 1, 282, 8742, 12345, 40000]) {
      const rand = mulberry32(steps + 1);
      const hourly = splitHourly(steps, rand);
      expect(hourly).toHaveLength(24);
      expect(hourly.reduce((a, b) => a + b, 0)).toBe(steps);
    }
  });
});

describe('指标换算', () => {
  it('热量与距离落在固定系数的 ±8% 内', () => {
    for (const steps of [500, 3000, 8742, 15000]) {
      const r = buildDayRecord('2026-04-10', steps, 10000, 42);
      const kcalBase = steps * KCAL_PER_STEP;
      const kmBase = (steps * METERS_PER_STEP) / 1000;
      expect(Math.abs(r.calories - kcalBase) / Math.max(1, kcalBase)).toBeLessThanOrEqual(0.081);
      expect(Math.abs(r.distanceKm - kmBase) / Math.max(0.001, kmBase)).toBeLessThanOrEqual(0.081);
    }
  });

  it('同一 seed + 同一天，结果完全一致', () => {
    const a = buildDayRecord('2026-04-10', 8742, 10000, 7);
    const b = buildDayRecord('2026-04-10', 8742, 10000, 7);
    expect(a).toEqual(b);
  });

  it('活动小时数不超过目标', () => {
    const r = buildDayRecord('2026-04-10', 20000, 10000, 3);
    expect(r.activeHours).toBeLessThanOrEqual(r.activeHoursGoal);
    expect(r.exerciseMinutes).toBeGreaterThan(0);
  });
});

describe('批次生成', () => {
  const base = {
    start: '2026-04-01',
    end: '2026-04-10',
    minSteps: 3000,
    maxSteps: 8000,
    goal: 10000,
    today: '2026-04-10',
    seed: 2026,
  };

  it('日期逐日展开且含两端', () => {
    expect(enumerateDates('2026-04-01', '2026-04-10')).toHaveLength(10);
    expect(enumerateDates('2026-04-10', '2026-04-01')).toHaveLength(10);
  });

  it('只有今天用今日页模板', () => {
    const list = buildBatch(base);
    expect(list).toHaveLength(10);
    expect(list.filter((d) => d.template === 'today')).toHaveLength(1);
    expect(list[list.length - 1].template).toBe('today');
    expect(list[0].template).toBe('history');
  });

  it('步数落在设定区间内', () => {
    for (const d of buildBatch(base)) {
      expect(d.record.steps).toBeGreaterThanOrEqual(3000);
      expect(d.record.steps).toBeLessThanOrEqual(8000);
    }
  });

  it('min/max 传反了也能正常工作', () => {
    const list = buildBatch({ ...base, minSteps: 8000, maxSteps: 3000 });
    for (const d of list) {
      expect(d.record.steps).toBeGreaterThanOrEqual(3000);
      expect(d.record.steps).toBeLessThanOrEqual(8000);
    }
  });
});

describe('展示格式', () => {
  it('千分位与日期文案', () => {
    expect(formatInt(8742)).toBe('8,742');
    expect(formatInt(10000)).toBe('10,000');
    expect(monthDayLabel('2026-04-10')).toBe('4月10日');
    expect(weekdayLabel('2026-04-10')).toBe('周五');
    expect(weekdayLabel('2026-11-16')).toBe('周一');
  });
});

describe('运动轨迹', () => {
  it('同 seed 稳定且落在画布内', () => {
    const a = makeTrace(12345);
    const b = makeTrace(12345);
    expect(a.d).toBe(b.d);
    expect(a.d.startsWith('M')).toBe(true);
    for (const [x, y] of [a.start, a.mid, a.end]) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(100);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(78);
    }
  });

  it('不同 seed 生成不同路线', () => {
    expect(makeTrace(1).d).not.toBe(makeTrace(2).d);
  });
});
