<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { addDays, buildBatch, formatInt, monthDayLabel, toISODate, weekdayLabel } from '../core/batch';
import type { ScheduledDay } from '../core/types';
import { downloadBlob, renderPng } from '../export/render';
import { exportZip } from '../export/zip';
import {
  canShareImages,
  downloadFiles,
  renderFiles,
  shareFiles,
  type ExportProgress,
} from '../export/batch';
import ControlPanel from './ControlPanel.vue';
import DevicePreview from './DevicePreview.vue';

const today = toISODate(new Date());

/** 每次打开页面都换一个种子，避免所有人拿到同一批数字；想复现就把它记下来填回去 */
const randomSeed = () => Math.floor(10000000 + Math.random() * 89999999);

const form = reactive({
  start: today,
  end: today,
  minSteps: 5000,
  maxSteps: 8000,
  goal: 10000,
  seed: randomSeed(),
  includeToday: true,
});

const days = ref<ScheduledDay[]>([]);
const selected = ref(0);
const busy = ref(false);
const exporting = ref(false);
const progress = ref<ExportProgress | null>(null);

/* ---------- 移动端适配 ---------- */
const mq = typeof window !== 'undefined' ? window.matchMedia('(max-width: 860px)') : null;
const isMobile = ref(mq?.matches ?? false);
const forcePanel = typeof location !== 'undefined' && new URLSearchParams(location.search).has('panel');
const panelOpen = ref(forcePanel || !(mq?.matches ?? false));
const vw = ref(typeof window !== 'undefined' ? window.innerWidth : 1440);
const vh = ref(typeof window !== 'undefined' ? window.innerHeight : 900);

const previewScale = computed(() => {
  if (!isMobile.value) return 0.68;
  // 同时按宽度和高度收：保证预览、操作按钮能在一屏内看到
  const byWidth = (vw.value - 48) / 393;
  const byHeight = (vh.value - 340) / 853.33;
  return Math.max(0.5, Math.min(0.72, byWidth, byHeight));
});

const shareSupported = ref(false);

function syncViewport() {
  vw.value = window.innerWidth;
  vh.value = window.innerHeight;
  const mobile = window.innerWidth <= 860;
  if (mobile !== isMobile.value) {
    isMobile.value = mobile;
    panelOpen.value = !mobile;
  }
}

onMounted(() => {
  syncViewport();
  shareSupported.value = canShareImages();
});

async function downloadCurrent() {
  if (!current.value || exporting.value) return;
  exporting.value = true;
  progress.value = { done: 0, total: 1, current: '渲染中' };
  try {
    const { record, template } = current.value;
    const blob = await renderPng(record, template);
    downloadBlob(blob, `steps-${record.date}.png`);
  } finally {
    exporting.value = false;
    progress.value = null;
  }
}

async function exportAll() {
  if (!days.value.length || exporting.value) return;
  exporting.value = true;
  try {
    await exportZip(days.value, (p) => {
      progress.value = p;
    });
  } finally {
    exporting.value = false;
    progress.value = null;
  }
}

/** 不打包，逐张保存；分享则必须先渲染缓存，再在第二次点击里同步调起系统面板 */
const prepared = ref<{ key: string; files: File[] } | null>(null);
const readyToShare = ref(false);

const batchKey = computed(() =>
  days.value.map((d) => `${d.record.date}-${d.record.steps}-${d.template}`).join('|'),
);

watch(batchKey, () => {
  prepared.value = null;
  readyToShare.value = false;
});

async function ensureFiles(): Promise<File[]> {
  if (prepared.value && prepared.value.key === batchKey.value) return prepared.value.files;
  const files = await renderFiles(days.value, (p) => {
    progress.value = p;
  });
  prepared.value = { key: batchKey.value, files };
  return files;
}

async function exportAsFiles() {
  if (!days.value.length || exporting.value) return;
  exporting.value = true;
  try {
    const files = await ensureFiles();
    downloadFiles(files);
  } finally {
    exporting.value = false;
    progress.value = null;
  }
}

/**
 * 系统分享面板要求调用发生在「用户手势」内，而渲染 N 张图要好几秒。
 * 所以第一次点击只负责把图渲染好，按钮变成「分享 N 张到相册」，再点一次才是真正的 share()。
 */
async function exportAsShare() {
  if (!days.value.length || exporting.value) return;

  if (!prepared.value || prepared.value.key !== batchKey.value) {
    exporting.value = true;
    try {
      await ensureFiles();
      readyToShare.value = true;
    } finally {
      exporting.value = false;
      progress.value = null;
    }
    return;
  }

  // 这里必须是同步的第一句，不能有 await
  try {
    await shareFiles(prepared.value.files);
    readyToShare.value = false;
  } catch (e) {
    const err = e as Error;
    if (err?.name !== 'AbortError') {
      window.alert(err?.message || String(e));
    }
  }
}

function generate() {
  busy.value = true;
  const lastAllowed = form.includeToday ? today : addDays(today, -1);
  let end = form.end > lastAllowed ? lastAllowed : form.end;
  let start = form.start > end ? end : form.start;
  form.start = start;
  form.end = end;

  const list = buildBatch({
    start,
    end,
    minSteps: Number(form.minSteps) || 0,
    maxSteps: Number(form.maxSteps) || 0,
    goal: Math.max(1000, Number(form.goal) || 10000),
    today,
    seed: Number(form.seed) || 1,
  });
  days.value = list;
  selected.value = Math.max(0, list.length - 1);
  busy.value = false;
}

function reroll() {
  form.seed = randomSeed();
  generate();
}

function move(step: number) {
  if (!days.value.length) return;
  selected.value = (selected.value + step + days.value.length) % days.value.length;
}

const current = computed(() => days.value[selected.value]);
const stepStats = computed(() => {
  if (!days.value.length) return { min: 0, max: 0, avg: 0 };
  const list = days.value.map((d) => d.record.steps);
  return {
    min: Math.min(...list),
    max: Math.max(...list),
    avg: Math.round(list.reduce((a, b) => a + b, 0) / list.length),
  };
});

function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') move(-1);
  if (e.key === 'ArrowRight') move(1);
}

onMounted(() => {
  generate();
  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', syncViewport);
});
onUnmounted(() => {
  window.removeEventListener('keydown', onKey);
  window.removeEventListener('resize', syncViewport);
});
</script>

<template>
  <div class="app">
    <header class="topbar">
      <div class="brand">
        <span class="mark">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 20c3.2 0 5.2-2.2 6.6-4.6C12.2 12.5 13.6 9 17 9c2 0 3 1.2 3 2.6 0 2.6-3.2 8.4-9 8.4H4z"
              fill="currentColor"
            />
          </svg>
        </span>
        <div class="titles">
          <b>步数截图生成器</b>
          <small>按日期范围逐日生成 · 全部在浏览器内完成</small>
        </div>
      </div>
      <div class="head-right">
        <button v-if="isMobile" class="params-btn" @click="panelOpen = !panelOpen">
          {{ panelOpen ? '收起参数' : '参数' }}
        </button>
        <span v-else class="state">历史页 + 今日页已还原 · 可导出 PNG / ZIP</span>
      </div>
    </header>

    <div class="layout" :class="{ mobile: isMobile }">
      <ControlPanel
        v-show="!isMobile || panelOpen"
        :form="form"
        :count="days.length"
        :today="today"
        @generate="generate"
        @reroll="reroll"
      />

      <main class="stage">
        <div v-if="current" class="preview-wrap">
          <div class="preview">
            <DevicePreview :record="current.record" :kind="current.template" :scale="previewScale" />
          </div>
          <div class="meta">
            <div class="line1">
              <span class="day">{{ monthDayLabel(current.record.date) }} {{ weekdayLabel(current.record.date) }}</span>
              <span v-if="current.template === 'today'" class="chip">今日页</span>
              <span v-else class="chip ghost">历史页</span>
            </div>
            <div class="line2">
              <b>{{ formatInt(current.record.steps) }}</b>
              <span>步 · {{ formatInt(current.record.calories) }} 千卡 · {{ current.record.distanceKm.toFixed(2) }} 公里</span>
            </div>
            <div class="pager">
              <button class="ghost-btn" @click="move(-1)">← 上一张</button>
              <span>{{ selected + 1 }} / {{ days.length }}</span>
              <button class="ghost-btn" @click="move(1)">下一张 →</button>
            </div>

            <div class="actions">
              <button class="dl" :disabled="exporting" @click="downloadCurrent">下载这张</button>
              <button class="dl ghost" :disabled="exporting || !days.length" @click="exportAsFiles">
                逐张保存{{ days.length > 1 ? ` ${days.length} 张` : '' }}
              </button>
              <button
                v-if="shareSupported"
                class="dl ghost"
                :class="{ ready: readyToShare }"
                :disabled="exporting || !days.length"
                @click="exportAsShare"
              >
                {{ readyToShare ? `分享 ${days.length} 张到相册` : '存到相册' }}
              </button>
              <button class="dl ghost zip" :disabled="exporting || !days.length" @click="exportAll">
                ZIP
              </button>
            </div>
            <p v-if="shareSupported" class="m-hint">
              {{
                readyToShare
                  ? `已渲染好 ${days.length} 张，再点一次「分享」即可存入相册。`
                  : '「存到相册」会先渲染图片，再点一次才会弹出系统分享面板（浏览器要求分享必须由点击直接触发）。'
              }}
            </p>
            <p v-else-if="isMobile" class="m-hint">
              「逐张保存」会连续存进相册或下载目录；当前浏览器不支持系统分享面板。
            </p>

            <div v-if="progress" class="progress">
              <i :style="{ width: `${(progress.done / Math.max(1, progress.total)) * 100}%` }" />
              <span>{{ progress.done }} / {{ progress.total }}{{ progress.current ? ' · ' + progress.current : '' }}</span>
            </div>
          </div>
        </div>
        <div v-else class="empty">左侧选择日期范围后点「生成预览」</div>

        <section class="strip">
          <div class="strip-head">
            <span>全部 {{ days.length }} 天</span>
            <span class="dim">步数 {{ formatInt(stepStats.min) }}–{{ formatInt(stepStats.max) }} · 日均 {{ formatInt(stepStats.avg) }}</span>
          </div>
          <div class="thumbs">
            <button
              v-for="(d, i) in days"
              :key="d.record.date"
              class="thumb"
              :class="{ on: i === selected, today: d.template === 'today' }"
              @click="selected = i"
            >
              <DevicePreview :record="d.record" :kind="d.template" :scale="0.165" lazy />
              <span class="thumb-date">{{ d.record.date.slice(5) }}</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f6f8;
  font-family: 'Inter', -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: #14161a;
}

.topbar {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid #e9ebef;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.mark {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: #14161a;
  color: #fff;
  display: grid;
  place-items: center;
}
.titles b {
  display: block;
  font-size: 15px;
  letter-spacing: 0.2px;
}
.titles small {
  display: block;
  font-size: 12px;
  color: #8b909a;
  margin-top: 2px;
}
.state {
  font-size: 12px;
  color: #8b909a;
  background: #f3f4f6;
  border-radius: 999px;
  padding: 6px 12px;
}

.layout {
  flex: 1;
  display: flex;
  min-height: 0;
}

.stage {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 20px 0;
  gap: 14px;
  overflow: hidden;
}

.preview-wrap {
  display: flex;
  gap: 28px;
  align-items: center;
}
.preview {
  flex: none;
}
.meta {
  width: 260px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.line1 {
  display: flex;
  align-items: center;
  gap: 8px;
}
.day {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.2px;
}
.chip {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 999px;
  background: #14161a;
  color: #fff;
}
.chip.ghost {
  background: #eceef1;
  color: #6b7280;
}
.line2 b {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.5px;
}
.line2 span {
  font-size: 13px;
  color: #8b909a;
  margin-left: 6px;
}
.pager {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
  font-size: 12px;
  color: #8b909a;
}
.note {
  margin: 4px 0 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: #a3a8b0;
  max-width: 250px;
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 4px;
}
.dl {
  width: 100%;
  height: 38px;
  border: none;
  border-radius: 10px;
  background: #14161a;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 0.2px;
}
.dl.ghost {
  background: #fff;
  color: #14161a;
  border: 1px solid #e2e5ea;
}
.dl:disabled {
  opacity: 0.45;
  cursor: default;
}
.dl.ready {
  background: #14161a;
  color: #fff;
  border-color: #14161a;
}
.progress {
  position: relative;
  height: 26px;
  border-radius: 8px;
  background: #eef0f3;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 0 10px;
  margin-top: 2px;
}
.progress i {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: #cfe6c6;
  transition: width 0.2s;
}
.progress span {
  position: relative;
  font-size: 11px;
  color: #4b5563;
}
.ghost-btn {
  border: 1px solid #e2e5ea;
  background: #fff;
  border-radius: 9px;
  padding: 7px 10px;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
}
.ghost-btn:hover {
  border-color: #c9ced6;
}

.empty {
  color: #9aa0a8;
  font-size: 14px;
  padding-top: 80px;
}

.strip {
  width: 100%;
  background: #fff;
  border-top: 1px solid #e9ebef;
  padding: 12px 4px 14px;
  flex: none;
  border-radius: 14px 14px 0 0;
  box-shadow: 0 -8px 24px rgba(17, 20, 26, 0.04);
}
.strip-head {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #374151;
  padding: 0 14px 10px;
}
.dim {
  color: #9aa0a8;
}
.thumbs {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 2px 14px 6px;
}
.thumb {
  flex: none;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  border-radius: 10px;
  outline: 2px solid transparent;
  outline-offset: 3px;
  content-visibility: auto;
  contain-intrinsic-size: 67px 152px;
}
.thumb.on {
  outline-color: #14161a;
}
.thumb-date {
  font-size: 11px;
  color: #8b909a;
}
.thumb.today .thumb-date {
  color: #14161a;
  font-weight: 600;
}

/* ---------- 移动端 ---------- */
.head-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.params-btn {
  height: 34px;
  padding: 0 14px;
  border: 1px solid #e2e5ea;
  border-radius: 9px;
  background: #fff;
  color: #14161a;
  font-size: 13px;
  cursor: pointer;
}
.m-hint {
  margin: 2px 0 0;
  font-size: 11.5px;
  line-height: 1.5;
  color: #a3a8b0;
}

@media (max-width: 860px) {
  .app {
    min-height: 100dvh;
  }
  .topbar {
    height: 56px;
    padding: 0 14px;
  }
  .titles small {
    display: none;
  }
  .layout.mobile {
    flex-direction: column;
    min-height: 0;
  }
  .layout.mobile :deep(.panel) {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e9ebef;
    padding: 16px 16px 18px;
    max-height: none;
    overflow: visible;
  }
  .layout.mobile .stage {
    padding: 16px 14px 0;
    overflow: visible;
    gap: 12px;
  }
  .layout.mobile .preview-wrap {
    flex-direction: column;
    width: 100%;
    gap: 14px;
  }
  .layout.mobile .meta {
    width: 100%;
  }
  .actions .dl {
    height: 44px;
    font-size: 14px;
  }
  .pager {
    justify-content: space-between;
  }
  .ghost-btn {
    padding: 9px 15px;
    font-size: 13px;
  }
  .strip-head {
    padding: 0 12px 8px;
  }
  .thumbs {
    padding: 2px 12px 6px;
  }
}
</style>
