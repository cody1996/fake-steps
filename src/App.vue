<script setup lang="ts">
import { useCapture } from './ui/useCapture';
import HistoryPage from './templates/HistoryPage.vue';
import TodayPage from './templates/TodayPage.vue';
import Workbench from './ui/Workbench.vue';

const capture = useCapture();
</script>

<template>
  <div v-if="capture" class="capture">
    <div class="stage">
      <TodayPage v-if="capture.kind === 'today'" :record="capture.record" />
      <HistoryPage v-else :record="capture.record" />
    </div>
  </div>
  <Workbench v-else />
</template>

<style>
.capture {
  width: 1179px;
  height: 2560px;
  overflow: hidden;
  background: #fff;
}
.capture .stage {
  width: 393px;
  height: 853.3333px;
  transform: scale(3);
  transform-origin: 0 0;
}
</style>
