<script setup lang="ts">
import { computed } from 'vue';
import {
  ChevronRight,
  Dumbbell,
  EllipsisVertical,
  Plus,
  Scan,
  Search,
  X,
} from 'lucide-vue-next';
import {
  PhCalendarBlank,
  PhFlame,
  PhMoon,
  PhPersonSimpleRun,
  PhPersonSimpleWalk,
  PhShieldChevron,
  PhUserCircle,
  PhWatch,
} from '@phosphor-icons/vue';
import type { DayRecord } from '../core/types';
import { formatInt } from '../core/batch';
import { hashString } from '../core/random';
import { makeTrace } from '../core/trace';
import StatusBar from './parts/StatusBar.vue';

const props = defineProps<{ record: DayRecord }>();

const trace = computed(() => makeTrace((hashString(props.record.date) ^ props.record.seed) >>> 0));
const dayOfMonth = computed(() => Number(props.record.date.slice(8, 10)));

const CX = 196;
const CY = 258;

/** 三段同心圆弧：外→内分别对应 活动热量 / 锻炼时长 / 活动小时数 */
const rings = [
  { r: 79.2, from: '#eec3bd', to: '#f8e8e5', fill: '#ec6a52', sweep: 250, start: 138 },
  { r: 57.7, from: '#f6e0b2', to: '#fbf3de', fill: '#f0b94e', sweep: 248, start: 142 },
  { r: 35.4, from: '#bcd6f6', to: '#e5eefb', fill: '#5c8be8', sweep: 246, start: 148 },
];

function pt(r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const progress = computed(() => [
  clamp01(props.record.calories / Math.max(1, props.record.caloriesGoal)),
  clamp01(props.record.exerciseMinutes / Math.max(1, props.record.exerciseGoal)),
  clamp01(props.record.activeHours / Math.max(1, props.record.activeHoursGoal)),
]);

const arcs = computed(() =>
  rings.map((ring, i) => {
    const p = progress.value[i];
    const trackEnd = ring.start + ring.sweep;
    const pStart = pt(ring.r, ring.start);
    const pTrackEnd = pt(ring.r, trackEnd);
    const pProgressEnd = pt(ring.r, ring.start + ring.sweep * p);
    const large = ring.sweep > 180 ? 1 : 0;
    return {
      ...ring,
      d: `M${pStart.x.toFixed(2)} ${pStart.y.toFixed(2)} A${ring.r} ${ring.r} 0 ${large} 1 ${pTrackEnd.x.toFixed(2)} ${pTrackEnd.y.toFixed(2)}`,
      pd: `M${pStart.x.toFixed(2)} ${pStart.y.toFixed(2)} A${ring.r} ${ring.r} 0 ${p * ring.sweep > 180 ? 1 : 0} 1 ${pProgressEnd.x.toFixed(2)} ${pProgressEnd.y.toFixed(2)}`,
      showProgress: p > 0.004,
      g0: pStart,
      g1: pTrackEnd,
    };
  }),
);

/** 三个彩色气泡：坐标取自参考图（落在各自圆弧的起点上） */
const bubbles = [
  { cls: 'red', x: 135.3, y: 308.9, d: 26.7 },
  { cls: 'amber', x: 148.7, y: 291.1, d: 23 },
  { cls: 'blue', x: 165.3, y: 275.7, d: 21 },
];

const metrics = computed(() => [
  {
    color: '#ee5b3f',
    label: '活动热量',
    value: formatInt(props.record.calories),
    total: `/${props.record.caloriesGoal} 千卡`,
  },
  {
    color: '#f2c14e',
    label: '锻炼时长',
    value: formatInt(props.record.exerciseMinutes),
    total: `/${props.record.exerciseGoal} 分钟`,
  },
  {
    color: '#4a7ff0',
    label: '活动小时数',
    value: formatInt(props.record.activeHours),
    total: `/${props.record.activeHoursGoal} 小时`,
  },
]);

const tabs = ['今日', '运动', '会员', '设备', '我的'];
</script>

<template>
  <div class="artboard today">
    <StatusBar :clock="record.clock" :battery="record.battery" />

    <div class="title">今日</div>
    <Search class="search" :size="21" :stroke-width="1.9" />
    <EllipsisVertical class="more" :size="20" :stroke-width="2" />

    <div class="steps">
      <svg class="shoe" width="18" height="13" viewBox="0 0 21 15">
        <path
          d="M2.4 13.4c-1.6 0-2.6-1-2.6-2.4 0-2.6 2.4-4.6 5-4.6 1.3 0 2.1.5 2.9 1.3.6.6 1.2.9 2 .9h2.1c2.2 0 4 1.3 4 3.2v1.6z"
          fill="#3a3a3c"
        />
        <path d="M6.8 7.2c.9-.9 2-1.5 3.3-1.5h1.6l-.6 2.2H9.2z" fill="#3a3a3c" />
      </svg>
      <span class="steps-num">{{ formatInt(record.steps) }}</span>
      <span class="steps-total">/{{ formatInt(record.goal) }}步</span>
    </div>

    <svg class="ring" width="393" height="360" viewBox="0 0 393 360">
      <defs>
        <linearGradient
          v-for="(a, i) in arcs"
          :id="`ring-g${i}`"
          :key="`g${i}`"
          gradientUnits="userSpaceOnUse"
          :x1="a.g0.x"
          :y1="a.g0.y"
          :x2="a.g1.x"
          :y2="a.g1.y"
        >
          <stop offset="0%" :stop-color="a.from" />
          <stop offset="100%" :stop-color="a.to" />
        </linearGradient>
      </defs>
      <path
        v-for="(a, i) in arcs"
        :key="`a${i}`"
        :d="a.d"
        fill="none"
        :stroke="`url(#ring-g${i})`"
        :stroke-width="20.5"
        stroke-linecap="round"
      />
      <path
        v-for="(a, i) in arcs"
        v-show="a.showProgress"
        :key="`p${i}`"
        :d="a.pd"
        fill="none"
        :stroke="a.fill"
        :stroke-width="20.5"
        stroke-linecap="round"
      />
    </svg>

    <div
      v-for="b in bubbles"
      :key="b.cls"
      class="bubble"
      :class="b.cls"
      :style="{ left: `${b.x - b.d / 2}px`, top: `${b.y - b.d / 2}px`, width: `${b.d}px`, height: `${b.d}px` }"
    >
      <PhFlame v-if="b.cls === 'red'" :size="16" weight="fill" color="#fff" />
      <PhPersonSimpleRun v-else-if="b.cls === 'amber'" :size="15" weight="fill" color="#fff" />
      <PhPersonSimpleWalk v-else :size="14" weight="fill" color="#fff" />
    </div>

    <div class="side-btn small">
      <Scan :size="15" :stroke-width="1.7" color="#3a3a3c" />
    </div>
    <div class="side-btn dark">
      <svg width="19" height="19" viewBox="0 0 19 19" fill="none">
        <circle cx="9.5" cy="9.5" r="3" fill="#fff" />
        <circle cx="9.5" cy="9.5" r="6.3" stroke="#fff" stroke-width="1.5" />
        <circle cx="9.5" cy="9.5" r="8.6" stroke="#fff" stroke-width="1.2" opacity=".55" />
      </svg>
    </div>

    <div class="metrics">
      <div v-for="(m, i) in metrics" :key="i" class="col" :style="{ left: `${[13.7, 135, 256.7][i]}px` }">
        <div class="m-head"><i :style="{ background: m.color }" /><span>{{ m.label }}</span></div>
        <div class="m-num">{{ m.value }}</div>
        <div class="m-sub">{{ m.total }}</div>
      </div>
      <i class="vline v1" />
      <i class="vline v2" />
    </div>

    <div class="sleep-pill">
      <div class="pill-inner">
        <PhMoon :size="17" weight="fill" color="#7d6bf0" />
        <span class="p-text">计划就寝 {{ record.bedTime }}</span>
        <span class="p-link">监测睡眠</span>
      </div>
      <div class="p-plus">
        <Plus :size="16" :stroke-width="1.8" color="#17181a" />
      </div>
    </div>

    <div class="card card-a">
      <div class="c-title">运动记录</div>
      <div class="c-value">
        <b>{{ record.workoutKm.toFixed(2) }}</b><span>公里</span>
      </div>
      <svg class="map" viewBox="0 0 100 78">
        <path
          :d="trace.d"
          fill="none"
          stroke="#4bbf7a"
          stroke-width="2.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <circle :cx="trace.start[0]" :cy="trace.start[1]" r="4.2" fill="#fff" stroke="#4bbf7a" stroke-width="2.4" />
        <circle :cx="trace.mid[0]" :cy="trace.mid[1]" r="3.6" fill="#fff" stroke="#f0a44b" stroke-width="2.2" />
      </svg>
      <div class="c-foot">
        <Dumbbell :size="13" :stroke-width="2" color="#e2612c" />
        <span>跑者下肢力量强化</span>
        <ChevronRight :size="12" :stroke-width="2" color="#e2612c" />
      </div>
    </div>

    <div class="card card-b">
      <div class="c-title">减脂第一步</div>
      <div class="close">
        <X :size="11" :stroke-width="1.8" color="#9a9a9a" />
      </div>
      <div class="c-sub">自测BMI，高效身材管理</div>
      <div class="gauge-wrap">
        <svg class="gauge" viewBox="0 0 156 156">
          <circle cx="78" cy="78" r="66" fill="none" stroke="#e9ebf2" stroke-width="19" />
          <path d="M78 12a66 66 0 0 0-46 113" fill="none" stroke="#f3d489" stroke-width="19" stroke-linecap="round" />
          <path d="M40 137a66 66 0 0 1-24-38" fill="none" stroke="#a5d79d" stroke-width="19" stroke-linecap="round" />
          <circle cx="78" cy="78" r="43" fill="#f3b943" />
          <path d="M78 44a34 34 0 0 1 24 10" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".85" />
          <path d="M78 78 62 52" stroke="#fff" stroke-width="5" stroke-linecap="round" />
          <circle cx="78" cy="78" r="5" fill="#fff" />
        </svg>
        <div class="gauge-value">-{{ record.fatLossKg }}kg</div>
      </div>
      <div class="gauge-unit">kcal↑</div>
      <div class="gauge-pct">%↑</div>
      <div class="c-link">立即评估 <span>›</span></div>
    </div>

    <div class="card card-c">
      <div class="c-title">睡眠<i class="dot" /></div>
      <div class="c-value sm">
        <b>{{ record.sleepText.split('小时')[0] }}</b><span>小时{{ record.sleepText.split('小时')[1] }}</span>
      </div>
    </div>

    <div class="card card-d">
      <div class="c-title">心脏健康</div>
      <div class="c-value sm"><b>{{ record.heartRate }}</b><span>次/分钟</span></div>
    </div>

    <div class="tabbar">
      <div v-for="(t, i) in tabs" :key="t" class="tab" :class="{ on: i === 0 }">
        <span class="tico">
          <PhCalendarBlank v-if="i === 0" :size="23" :color="'#f5a04a'" />
          <PhPersonSimpleRun v-else-if="i === 1" :size="22" weight="fill" color="#c8c8cb" />
          <PhShieldChevron v-else-if="i === 2" :size="22" weight="fill" color="#c8c8cb" />
          <PhWatch v-else-if="i === 3" :size="22" weight="fill" color="#c8c8cb" />
          <PhUserCircle v-else :size="22" weight="fill" color="#c8c8cb" />
          <b v-if="i === 0" class="tico-num">{{ dayOfMonth }}</b>
        </span>
        <span>{{ t }}</span>
        <i v-if="i === 2 || i === 4" class="badge" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.artboard {
  position: relative;
  width: 393px;
  height: 853.3333px;
  overflow: hidden;
  background: #f2f3f5;
  color: #17181a;
  font-family: 'StepFont', -apple-system, 'PingFang SC', 'HarmonyOS Sans SC', 'Microsoft YaHei', sans-serif;
  user-select: none;
  font-variant-numeric: tabular-nums;
}

.title {
  position: absolute;
  left: 19px;
  top: 63.3px;
  font-size: 26.5px;
  font-weight: 700;
  letter-spacing: 0.6px;
  line-height: 30px;
}
.search {
  position: absolute;
  left: 287px;
  top: 66px;
}
.more {
  position: absolute;
  left: 344px;
  top: 68px;
}

.steps {
  position: absolute;
  left: 19.3px;
  top: 113px;
  display: flex;
  align-items: center;
  height: 22px;
}
.shoe {
  margin-right: 6px;
}
.steps-num {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.6px;
}
.steps-total {
  font-size: 17px;
  color: #8c8c8c;
  letter-spacing: -0.4px;
}

.ring {
  position: absolute;
  left: 0;
  top: 0;
}
.bubble {
  position: absolute;
  display: grid;
  place-items: center;
  border-radius: 50%;
}
.bubble.red {
  background: #e8452f;
}
.bubble.amber {
  background: #f2a43a;
}
.bubble.blue {
  background: #2f6fe4;
}

.side-btn {
  position: absolute;
  border-radius: 50%;
  display: grid;
  place-items: center;
}
.side-btn.small {
  left: 325px;
  top: 201.7px;
  width: 26px;
  height: 26px;
  background: #f7f7f9;
}
.side-btn.dark {
  left: 322px;
  top: 243px;
  width: 32px;
  height: 32px;
  background: #2b2b2e;
}

/* metrics */
.metrics {
  position: absolute;
  left: 0;
  top: 352.7px;
  width: 393px;
  height: 78px;
}
.col {
  position: absolute;
  width: 121.3px;
  text-align: center;
}
.m-head {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 16px;
  line-height: 16px;
  font-size: 13.9px;
  color: #595959;
  letter-spacing: 0.2px;
}
.m-head i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}
.m-num {
  position: absolute;
  left: 0;
  width: 100%;
  top: 18.3px;
  font-size: 27.3px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.5px;
}
.m-sub {
  position: absolute;
  left: 0;
  width: 100%;
  top: 51.7px;
  font-size: 13.5px;
  color: #595959;
  letter-spacing: 0.2px;
}
.vline {
  position: absolute;
  top: 0;
  width: 1px;
  height: 62px;
  background: #e6e7ea;
}
.vline.v1 {
  left: 135px;
}
.vline.v2 {
  left: 256.7px;
}

/* bedtime pill */
.sleep-pill {
  position: absolute;
  left: 13.7px;
  top: 448px;
  width: 365.3px;
  height: 65.3px;
  background: #fff;
  border-radius: 32.7px;
  display: flex;
  align-items: center;
  padding: 0 10px 0 12px;
}
.pill-inner {
  flex: 1;
  height: 43px;
  background: #f6f6f9;
  border-radius: 21.5px;
  display: flex;
  align-items: center;
  padding: 0 14px;
  gap: 7px;
}
.p-text {
  font-size: 15.1px;
  font-weight: 500;
  letter-spacing: 0.2px;
}
.p-link {
  margin-left: auto;
  font-size: 15.1px;
  color: #7d6bf0;
  letter-spacing: 0.2px;
}
.p-plus {
  width: 34px;
  height: 34px;
  margin-left: 8px;
  border-radius: 50%;
  background: #f6f6f9;
  display: grid;
  place-items: center;
}

/* cards */
.card {
  position: absolute;
  width: 175.7px;
  background: #fff;
  border-radius: 13.7px;
  overflow: hidden;
}
.card-a,
.card-b {
  top: 527.3px;
  height: 175.3px;
}
.card-a {
  left: 13.7px;
}
.card-b {
  left: 203.3px;
}
.card-c,
.card-d {
  top: 717.3px;
  height: 175.3px;
}
.card-c {
  left: 13.7px;
}
.card-d {
  left: 203.3px;
}
.c-title {
  position: absolute;
  left: 13.3px;
  top: 15px;
  font-size: 15.5px;
  font-weight: 600;
  letter-spacing: 0.3px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.dot {
  width: 5.5px;
  height: 5.5px;
  border-radius: 50%;
  background: #f04438;
}
.c-value {
  position: absolute;
  left: 13.3px;
  top: 30.3px;
  display: flex;
  align-items: baseline;
  gap: 3px;
}
.c-value b {
  font-size: 27px;
  font-weight: 700;
  letter-spacing: -1.2px;
}
.c-value span {
  font-size: 15.5px;
  color: #3c3c3e;
}
.c-value.sm b {
  font-size: 22px;
}
.card-c .c-value,
.card-d .c-value {
  top: 36px;
}
.c-value.sm span {
  font-size: 11px;
}
.map {
  position: absolute;
  left: 52px;
  top: 70px;
  width: 72px;
  height: 60px;
}
.c-foot {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 12.6px;
  height: 18.7px;
  background: linear-gradient(180deg, #fff5ef 0%, #ffe9dc 100%);
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 0 13.3px;
  color: #e2612c;
  font-size: 12px;
  letter-spacing: 0.2px;
}
.close {
  position: absolute;
  right: 10px;
  top: 10px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #f2f2f4;
  display: grid;
  place-items: center;
}
.c-sub {
  position: absolute;
  left: 13.3px;
  top: 38px;
  font-size: 13.9px;
  color: #595959;
}
.gauge-wrap {
  position: absolute;
  left: 49.7px;
  top: 67.7px;
  width: 78px;
  height: 78px;
}
.gauge {
  width: 78px;
  height: 78px;
  display: block;
}
.gauge-value {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 8px;
  font-size: 17px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.2px;
}
.gauge-unit {
  position: absolute;
  left: 123.4px;
  top: 82.7px;
  font-size: 7.5px;
  color: #e6a63c;
}
.gauge-pct {
  position: absolute;
  left: 40px;
  top: 110.7px;
  font-size: 7.5px;
  color: #7ba06f;
}
.c-link {
  position: absolute;
  left: 12px;
  bottom: 10px;
  font-size: 13.5px;
  color: #3c3c3e;
  letter-spacing: 0.2px;
}

/* tabbar */
.tabbar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 84px;
  background: #f2f3f5;
  display: flex;
  padding-top: 13px;
}
.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  position: relative;
  font-size: 10.5px;
  color: #8b8b8f;
  letter-spacing: 0.3px;
}
.tab.on {
  color: #f5a04a;
}
.tico {
  position: relative;
  width: 23px;
  height: 23px;
  display: grid;
  place-items: center;
}
.tico-num {
  position: absolute;
  left: 0;
  right: 0;
  top: 10px;
  text-align: center;
  font-size: 7px;
  font-weight: 700;
  line-height: 1;
  color: #f5a04a;
}
.badge {
  position: absolute;
  right: 22px;
  top: -2px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f04438;
}
</style>
