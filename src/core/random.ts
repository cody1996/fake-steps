/** 可复现的伪随机数：同一个 seed + 同样的调用顺序 = 同样的结果。 */
export type Rand = () => number;

export function mulberry32(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 把字符串（如日期）碾成 32 位种子，便于「按天」稳定随机。 */
export function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 用主 seed + 日期派生一天的独立随机流，改一天不会影响其他天。 */
export function dayRandom(seed: number, date: string): Rand {
  return mulberry32((seed ^ hashString(date)) >>> 0);
}

export function randInt(rand: Rand, min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1));
}

export function randFloat(rand: Rand, min: number, max: number): number {
  return min + rand() * (max - min);
}

/** 上下浮动 1 ± pct，例如 jitter(rand, 0.08) 得到 0.92–1.08。 */
export function jitter(rand: Rand, pct: number): number {
  return 1 + (rand() * 2 - 1) * pct;
}

export function pick<T>(rand: Rand, list: readonly T[]): T {
  return list[Math.min(list.length - 1, Math.floor(rand() * list.length))];
}
