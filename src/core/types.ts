/** 一天的完整数据模型：截图里出现的所有数值都从这里取。 */
export interface DayRecord {
  /** 本地日期，YYYY-MM-DD */
  date: string;
  /** 当天步数 */
  steps: number;
  /** 目标步数 */
  goal: number;
  /** 活动热量（千卡） */
  calories: number;
  /** 活动热量目标（千卡） */
  caloriesGoal: number;
  /** 距离（公里） */
  distanceKm: number;
  /** 24 小时步数分布，长度 24，总和 = steps */
  hourly: number[];
  /** 活动小时数 */
  activeHours: number;
  activeHoursGoal: number;
  /** 锻炼时长（分钟） */
  exerciseMinutes: number;
  exerciseGoal: number;
  /** 运动记录里的单次运动距离（公里） */
  workoutKm: number;
  /** 睡眠时长文案，如 5小时41分 */
  sleepText: string;
  /** 心率 */
  heartRate: number;
  /** 减脂卡片上的 -N kg */
  fatLossKg: number;
  /** 计划就寝时间 */
  bedTime: string;
  /** 状态栏时间 */
  clock: string;
  /** 状态栏电量 */
  battery: number;
}

export type TemplateKind = 'today' | 'history';

export interface BatchOptions {
  start: string;
  end: string;
  minSteps: number;
  maxSteps: number;
  goal: number;
  /** 今天（本地），用于决定哪一天用今日页模板 */
  today: string;
  seed: number;
}

export interface ScheduledDay {
  record: DayRecord;
  template: TemplateKind;
}
