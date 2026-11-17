<script setup lang="ts">
import { computed } from 'vue';
import { addDays } from '../core/batch';

export interface FormState {
  start: string;
  end: string;
  minSteps: number;
  maxSteps: number;
  goal: number;
  seed: number;
  includeToday: boolean;
}

const props = defineProps<{ form: FormState; count: number; today: string }>();
const emit = defineEmits<{ generate: []; reroll: [] }>();

/** 不包含今天时，最晚只能选到昨天 */
const lastSelectable = computed(() => (props.form.includeToday ? props.today : addDays(props.today, -1)));

function preset(days: number) {
  const end = props.form.includeToday ? props.today : addDays(props.today, -1);
  props.form.end = end;
  props.form.start = addDays(end, -(days - 1));
  emit('generate');
}

function todayOnly() {
  props.form.start = props.today;
  props.form.end = props.today;
  emit('generate');
}

function toggleIncludeToday() {
  props.form.includeToday = !props.form.includeToday;
  if (!props.form.includeToday && props.form.end >= props.today) {
    props.form.end = addDays(props.today, -1);
  }
  if (props.form.start > props.form.end) props.form.start = props.form.end;
  emit('generate');
}

function stepPreset(min: number, max: number) {
  props.form.minSteps = min;
  props.form.maxSteps = max;
  emit('generate');
}
</script>

<template>
  <aside class="panel">
    <section>
      <h3>生成范围</h3>
      <div class="row two">
        <label>
          <span>开始</span>
          <input v-model="form.start" type="date" :max="lastSelectable" />
        </label>
        <label>
          <span>结束</span>
          <input v-model="form.end" type="date" :max="lastSelectable" />
        </label>
      </div>
      <button class="switch-row" type="button" @click="toggleIncludeToday">
        <span>包含今天</span>
        <i class="switch" :class="{ on: form.includeToday }"><b /></i>
      </button>
      <div class="quick">
        <button v-if="form.includeToday" @click="todayOnly">今天</button>
        <button @click="preset(7)">最近 7 天</button>
        <button @click="preset(30)">最近 30 天</button>
      </div>
    </section>

    <section>
      <h3>每日步数</h3>
      <div class="row two">
        <label>
          <span>下限</span>
          <input v-model.number="form.minSteps" type="number" min="0" step="100" />
        </label>
        <label>
          <span>上限</span>
          <input v-model.number="form.maxSteps" type="number" min="0" step="100" />
        </label>
      </div>
      <div class="quick">
        <button @click="stepPreset(3000, 5000)">3k–5k</button>
        <button @click="stepPreset(5000, 8000)">5k–8k</button>
        <button @click="stepPreset(10000, 15000)">10k–15k</button>
      </div>
      <label class="row">
        <span>目标步数</span>
        <input v-model.number="form.goal" type="number" min="1000" step="500" />
      </label>
    </section>

    <section>
      <h3>随机种子</h3>
      <div class="row seed">
        <input v-model.number="form.seed" type="number" />
        <button class="dice" title="换一批随机数" @click="emit('reroll')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <rect x="3.5" y="3.5" width="17" height="17" rx="4" stroke="currentColor" stroke-width="1.7" />
            <circle cx="8.6" cy="8.6" r="1.5" fill="currentColor" />
            <circle cx="15.4" cy="8.6" r="1.5" fill="currentColor" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            <circle cx="8.6" cy="15.4" r="1.5" fill="currentColor" />
            <circle cx="15.4" cy="15.4" r="1.5" fill="currentColor" />
          </svg>
        </button>
      </div>
      <p class="hint">相同参数 + 相同种子 = 完全相同的图片；种子每次打开页面随机生成，想复现就把它记下来。</p>
    </section>

    <button class="primary" @click="emit('generate')">
      生成预览<span v-if="count" class="count">· {{ count }} 天</span>
    </button>

    <p class="foot">
      勾选「包含今天」时，今天的截图用「今日页」模板；取消勾选则只生成到昨天，全部用「历史页」。
    </p>
  </aside>
</template>

<style scoped>
.panel {
  width: 292px;
  flex: none;
  background: #fff;
  border-right: 1px solid #e9ebef;
  padding: 20px 18px 24px;
  display: flex;
  flex-direction: column;
  gap: 22px;
  overflow-y: auto;
}
h3 {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  letter-spacing: 0.6px;
}
.row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.row.two {
  gap: 10px;
}
label {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}
label span {
  font-size: 11px;
  color: #9aa0a8;
}
label.row {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}
label.row span {
  font-size: 12px;
  color: #374151;
}
input {
  width: 100%;
  min-width: 0;
  height: 34px;
  padding: 0 10px;
  border: 1px solid #e2e5ea;
  border-radius: 9px;
  background: #fbfcfd;
  font-size: 13px;
  color: #14161a;
  outline: none;
  font-variant-numeric: tabular-nums;
}
input:focus {
  border-color: #14161a;
  background: #fff;
}
label.row input {
  width: 108px;
}
.quick {
  display: flex;
  gap: 6px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.quick button {
  border: 1px solid #e6e8ec;
  background: #f7f8fa;
  color: #4b5563;
  font-size: 11.5px;
  padding: 5px 9px;
  border-radius: 7px;
  cursor: pointer;
}
.quick button:hover {
  background: #eef0f3;
}
.switch-row {
  width: 100%;
  margin-top: 10px;
  padding: 7px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #e6e8ec;
  background: #fbfcfd;
  border-radius: 9px;
  font-size: 12.5px;
  color: #374151;
  cursor: pointer;
}
.switch {
  width: 34px;
  height: 20px;
  border-radius: 10px;
  background: #dcdfe4;
  position: relative;
  transition: background 0.15s;
  flex: none;
}
.switch b {
  position: absolute;
  left: 2px;
  top: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  transition: left 0.15s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}
.switch.on {
  background: #14161a;
}
.switch.on b {
  left: 16px;
}
.seed input {
  flex: 1;
}
.dice {
  width: 34px;
  height: 34px;
  flex: none;
  border: 1px solid #e2e5ea;
  background: #fbfcfd;
  border-radius: 9px;
  display: grid;
  place-items: center;
  color: #4b5563;
  cursor: pointer;
}
.dice:hover {
  color: #14161a;
  border-color: #c9ced6;
}
.hint {
  margin: 8px 0 0;
  font-size: 11px;
  color: #a3a8b0;
  line-height: 1.5;
}
.primary {
  height: 42px;
  border: none;
  border-radius: 11px;
  background: #14161a;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.3px;
  cursor: pointer;
}
.primary:hover {
  background: #000;
}
.count {
  opacity: 0.7;
  font-weight: 500;
}
.foot {
  margin: 0;
  font-size: 11px;
  line-height: 1.6;
  color: #a3a8b0;
}
</style>
