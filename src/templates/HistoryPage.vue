<script setup lang="ts">
import { computed } from 'vue';
import { ChevronLeft, ChevronRight, EllipsisVertical, Share2, SquarePen } from 'lucide-vue-next';
import type { DayRecord } from '../core/types';
import { formatInt, monthDayLabel, weekdayLabel } from '../core/batch';
import StatusBar from './parts/StatusBar.vue';

const props = defineProps<{ record: DayRecord }>();

const progress = computed(() =>
  Math.max(0, Math.min(1, props.record.steps / Math.max(1, props.record.goal))),
);
const laps = computed(() => ((props.record.distanceKm * 1000) / 400).toFixed(2));
const burger = computed(() => Math.max(1, Math.round(props.record.calories / 250)));

/** 图表：0 在 y=460.3，2000 在 y=315（逻辑像素） */
const CHART_TOP = 315;
const CHART_BOTTOM = 460.3;
const AXIS_MAX = 2000;
const SLOT_PITCH = 6.04;
const BAR_W = 2.7;

/** 24 小时数据拆成 48 个半小时柱子，视觉上更接近参考图的密度 */
const bars = computed(() => {
  const out: { left: number; height: number }[] = [];
  const span = CHART_BOTTOM - CHART_TOP;
  props.record.hourly.forEach((v, i) => {
    const first = Math.round(v * 0.55);
    const second = v - first;
    [first, second].forEach((part, k) => {
      const idx = i * 2 + k;
      const ratio = Math.min(1, part / AXIS_MAX);
      out.push({
        left: 30 + (idx + 0.5) * SLOT_PITCH - BAR_W / 2,
        height: Math.max(part > 0 ? 1.6 : 0, ratio * span),
      });
    });
  });
  return out;
});

const grid = [
  { v: 2000, y: 0 },
  { v: 1500, y: 36.33 },
  { v: 1000, y: 72.67 },
  { v: 500, y: 109 },
  { v: 0, y: 145.33 },
];
</script>

<template>
  <div class="artboard history">
    <StatusBar :clock="record.clock" :battery="record.battery" />

    <div class="nav">
      <svg class="back" width="22" height="13" viewBox="0 0 24 14" fill="none">
        <path d="M23 7H1.4M9.4 1.2 1.6 7l7.8 5.8" stroke="#17181a" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <div class="nav-title">步数</div>
      <Share2 class="share" :size="20" :stroke-width="1.8" color="#17181a" />
      <EllipsisVertical class="more" :size="20" :stroke-width="2" color="#17181a" />
    </div>

    <div class="segmented">
      <span class="seg active">日</span>
      <span class="seg">周</span>
      <span class="seg">月</span>
      <span class="seg">年</span>
    </div>

    <ChevronLeft class="chev left" :size="19" :stroke-width="1.9" color="#c9c9c9" />
    <ChevronRight class="chev right" :size="19" :stroke-width="1.9" color="#c9c9c9" />

    <div class="date">
      {{ monthDayLabel(record.date) }} {{ weekdayLabel(record.date) }}
      <svg class="caret" width="10" height="6" viewBox="0 0 10 6">
        <path d="M0.7 0.7h8.6L5 5.3z" fill="#6f6f6f" />
      </svg>
    </div>

    <div class="time-range">00:00-23:59</div>

    <div class="hero">
      <span class="hero-num">{{ formatInt(record.steps) }}</span>
      <span class="hero-unit">步</span>
    </div>

    <div class="chart">
      <div v-for="g in grid" :key="g.v" class="grid" :style="{ top: `${g.y}px` }">
        <span class="grid-label">{{ formatInt(g.v) }}</span>
      </div>
      <i class="axis" />
      <i
        v-for="(b, i) in bars"
        :key="i"
        class="bar"
        :class="{ empty: b.height === 0 }"
        :style="{ left: `${b.left}px`, height: `${b.height}px` }"
      />
    </div>

    <div class="x-labels">
      <span style="left: 30px">00:00</span>
      <span style="left: 96.3px">06:00</span>
      <span style="left: 163.3px">12:00</span>
      <span style="left: 228.7px">18:00</span>
    </div>
    <div class="x-last">
      24:00<i />
    </div>

    <div class="sheet">
      <svg class="wave" width="393" height="348" viewBox="0 0 393 348" preserveAspectRatio="none">
        <path
          d="M0 17.3H300c8 0 12-8.8 18-11.8 5-2.1 11-2.3 17-2.3s12 .2 17 2.3c6 3 10 11.8 18 11.8h23v330.7H0z"
          fill="#f2f2f2"
        />
      </svg>
      <div class="handle" />

      <div class="card">
        <div class="head">
          <span class="h-title">目标进度</span>
          <SquarePen class="edit" :size="17" :stroke-width="1.5" color="#17181a" />
          <span class="h-sub">达标提醒</span>
          <i class="toggle" />
        </div>

        <div class="goal">
          <b>{{ formatInt(record.steps) }}</b><span>/{{ formatInt(record.goal) }}步</span>
        </div>

        <div class="track"><i :style="{ width: `${progress * 100}%` }" /></div>

        <div class="divider d1" />

        <div class="m-label l1">消耗</div>
        <div class="m-value v1"><b>{{ formatInt(record.calories) }}</b><span>千卡</span></div>
        <div class="m-note n1">相当于消耗{{ burger }}个汉堡</div>

        <div class="divider d2" />

        <div class="m-label l2">距离</div>
        <div class="m-value v2"><b>{{ record.distanceKm.toFixed(2) }}</b><span>公里</span></div>
        <div class="m-note n2">相当于走了{{ laps }}圈标准操场</div>
      </div>

      <div class="bottom-bar"><i class="home-bar" /></div>
    </div>
  </div>
</template>

<style scoped>
.artboard {
  position: relative;
  width: 393px;
  height: 853.3333px;
  overflow: hidden;
  background: #ffffff;
  color: #17181a;
  font-family: 'StepFont', -apple-system, 'PingFang SC', 'HarmonyOS Sans SC', 'Microsoft YaHei', sans-serif;
  user-select: none;
  font-variant-numeric: tabular-nums;
}

/* ---------- nav ---------- */
.back {
  position: absolute;
  left: 29px;
  top: 67.5px;
}
.nav-title {
  position: absolute;
  left: 68px;
  top: 63.7px;
  font-size: 23.5px;
  font-weight: 600;
  line-height: 30px;
  letter-spacing: 0;
}
.share {
  position: absolute;
  left: 286px;
  top: 68px;
}
.more {
  position: absolute;
  left: 356px;
  top: 70px;
}

/* ---------- segmented ---------- */
.segmented {
  position: absolute;
  top: 128.7px;
  left: 0;
  right: 0;
  height: 28px;
  display: flex;
  justify-content: center;
}
.seg {
  width: 35.7px;
  height: 28px;
  line-height: 26px;
  text-align: center;
  font-size: 18px;
  color: #595959;
  position: relative;
  letter-spacing: 0.5px;
}
.seg.active {
  color: #8bc97b;
}
.seg.active::after {
  content: '';
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 26px;
  width: 18px;
  height: 2.6px;
  border-radius: 2px;
  background: #8bc97b;
}

/* ---------- date ---------- */
.chev {
  position: absolute;
  top: 197px;
}
.chev.left {
  left: 28px;
}
.chev.right {
  left: 355px;
}
.date {
  position: absolute;
  top: 195px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 15.2px;
  line-height: 22px;
  color: #595959;
  letter-spacing: 0.4px;
}
.caret {
  margin-left: 2px;
  vertical-align: 1px;
}
.time-range {
  position: absolute;
  top: 223.7px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 16.1px;
  line-height: 22px;
  color: #595959;
  letter-spacing: 0.2px;
}

/* ---------- hero ---------- */
.hero {
  position: absolute;
  top: 244.6px;
  left: 10.5px;
  right: -10.5px;
  text-align: center;
  height: 52px;
  white-space: nowrap;
}
.hero-num {
  font-size: 44.8px;
  font-weight: 500;
  line-height: 50px;
  letter-spacing: -1.6px;
}
.hero-unit {
  font-size: 14px;
  margin-left: 2px;
  letter-spacing: 0;
  vertical-align: 9px;
}

/* ---------- chart ---------- */
.chart {
  position: absolute;
  top: 315px;
  left: 0;
  width: 393px;
  height: 146px;
}
.grid {
  position: absolute;
  left: 26.7px;
  width: 308.6px;
  height: 1px;
  background: #ededed;
}
.grid-label {
  position: absolute;
  right: -32px;
  bottom: 0px;
  width: 55px;
  font-size: 12.1px;
  color: #595959;
  text-align: right;
  letter-spacing: 0.2px;
}
.axis {
  position: absolute;
  left: 334.5px;
  top: 0;
  width: 1px;
  height: 148px;
  background: linear-gradient(
    180deg,
    rgba(150, 160, 148, 0) 0%,
    rgba(140, 155, 138, 0.42) 42%,
    rgba(150, 160, 148, 0) 100%
  );
}
.bar {
  position: absolute;
  bottom: 0;
  width: 2.7px;
  border-radius: 1.4px 1.4px 0 0;
  background: #a8d99b;
}
.bar.empty {
  height: 0 !important;
}
.x-labels span {
  position: absolute;
  top: 507px;
  font-size: 12px;
  color: #595959;
  letter-spacing: 0.2px;
}
.x-last {
  position: absolute;
  top: 494px;
  left: 294px;
  font-size: 12.1px;
  font-weight: 600;
  color: #17181a;
  letter-spacing: 0.2px;
}
.x-last i {
  position: absolute;
  left: 39px;
  top: 2px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #8bc97b;
}

/* ---------- sheet ---------- */
.sheet {
  position: absolute;
  left: 0;
  right: 0;
  top: 506px;
  bottom: 0;
}
.wave {
  position: absolute;
  left: 0;
  top: 0;
  width: 393px;
  height: 348px;
}
.handle {
  position: absolute;
  left: 324.15px;
  top: 3.15px;
  width: 21.7px;
  height: 21.7px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(20, 24, 30, 0.07);
}
.card {
  position: absolute;
  left: 13.7px;
  right: 13.4px;
  top: 45.7px;
  bottom: 0;
  background: #fff;
  border-radius: 13.3px;
}
.head {
  position: absolute;
  left: 14.3px;
  top: 23.7px;
  right: 3px;
  height: 22px;
}
.h-title {
  position: absolute;
  left: 0;
  top: 0;
  font-size: 16.6px;
  font-weight: 600;
  line-height: 22px;
  letter-spacing: 0.5px;
}
.edit {
  position: absolute;
  left: 74px;
  top: 3px;
}
.h-sub {
  position: absolute;
  right: 70px;
  top: 2px;
  font-size: 15px;
  line-height: 20px;
  color: #595959;
  letter-spacing: 0.5px;
}
.toggle {
  position: absolute;
  right: 0;
  top: 1px;
  width: 34px;
  height: 21px;
  border-radius: 10.5px;
  background: #e9e9e9;
}
.toggle::after {
  content: '';
  position: absolute;
  left: 2px;
  top: 2px;
  width: 17px;
  height: 17px;
  border-radius: 50%;
  background: #fff;
}
.goal {
  position: absolute;
  left: 14.3px;
  top: 60px;
  white-space: nowrap;
}
.goal b {
  font-size: 22.6px;
  font-weight: 700;
  letter-spacing: -0.8px;
}
.goal span {
  font-size: 14px;
  color: #595959;
  letter-spacing: 0.2px;
  margin-left: 1px;
}
.track {
  position: absolute;
  left: 13.3px;
  right: 13.3px;
  top: 103px;
  height: 22.3px;
  border-radius: 11.2px;
  background: #ededed;
  overflow: hidden;
}
.track i {
  display: block;
  height: 100%;
  border-radius: 11.2px;
  background: linear-gradient(90deg, #86c172 0%, #a4de91 100%);
}
.divider {
  position: absolute;
  left: 13.3px;
  right: 13.3px;
  height: 1px;
  background: #efefef;
}
.divider.d1 {
  top: 145px;
}
.divider.d2 {
  top: 217px;
}
.m-label {
  position: absolute;
  left: 16.3px;
  font-size: 13px;
  color: #8a8a8a;
  letter-spacing: 0.4px;
}
.l1 {
  top: 155px;
}
.l2 {
  top: 228px;
}
.m-value {
  position: absolute;
  left: 14px;
  white-space: nowrap;
}
.m-value b {
  font-size: 22.5px;
  font-weight: 600;
  letter-spacing: -1px;
}
.m-value span {
  font-size: 11.5px;
  letter-spacing: 0.4px;
}
.v1 {
  top: 175px;
}
.v2 {
  top: 248px;
}
.m-note {
  position: absolute;
  right: 15px;
  font-size: 14.5px;
  color: #595959;
  letter-spacing: 0.2px;
}
.n1 {
  top: 185px;
}
.n2 {
  top: 258px;
}
.bottom-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 20px;
  background: #fff;
}
.home-bar {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 8.1px;
  width: 162px;
  height: 4.2px;
  border-radius: 3px;
  background: #bdbdbd;
}
</style>
