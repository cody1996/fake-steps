<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import type { DayRecord, TemplateKind } from '../core/types';
import HistoryPage from '../templates/HistoryPage.vue';
import TodayPage from '../templates/TodayPage.vue';

const props = defineProps<{
  record: DayRecord;
  kind: TemplateKind;
  scale: number;
  lazy?: boolean;
}>();

const host = ref<HTMLElement | null>(null);
const visible = ref(!props.lazy);
let io: IntersectionObserver | null = null;

onMounted(() => {
  if (!props.lazy || !host.value) return;
  io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        visible.value = true;
        io?.disconnect();
      }
    },
    { rootMargin: '400px' },
  );
  io.observe(host.value);
});

onUnmounted(() => io?.disconnect());
</script>

<template>
  <div
    ref="host"
    class="device"
    :style="{ width: `${393 * scale}px`, height: `${853.3333 * scale}px`, borderRadius: `${16 * scale}px` }"
  >
    <div v-if="visible" class="canvas" :style="{ transform: `scale(${scale})` }">
      <TodayPage v-if="kind === 'today'" :record="record" />
      <HistoryPage v-else :record="record" />
    </div>
  </div>
</template>

<style scoped>
.device {
  position: relative;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 18px 40px rgba(17, 20, 26, 0.14), 0 2px 6px rgba(17, 20, 26, 0.06);
}
.canvas {
  width: 393px;
  height: 853.3333px;
  transform-origin: 0 0;
}
.pending {
  width: 393px;
  height: 853.3333px;
  background: #f2f3f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #9aa0a8;
  font-size: 16px;
}
.pending b {
  font-size: 20px;
  color: #6b7280;
}
</style>
