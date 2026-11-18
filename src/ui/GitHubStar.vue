<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { PhStar } from '@phosphor-icons/vue';

const REPO = 'https://github.com/cody1996/fake-steps';
const CACHE_KEY = 'gh-stars:cody1996/fake-steps';
const CACHE_TTL = 30 * 60 * 1000; // 30 分钟内不再请求，避开匿名 API 的 60 次/小时限额

const stars = ref<number | null>(null);

function readCache(): number | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { value, at } = JSON.parse(raw) as { value: number; at: number };
    if (typeof value === 'number' && Date.now() - at < CACHE_TTL) return value;
  } catch {
    /* 隐私模式下 localStorage 可能不可用 */
  }
  return null;
}

function writeCache(value: number): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ value, at: Date.now() }));
  } catch {
    /* 忽略 */
  }
}

onMounted(async () => {
  const cached = readCache();
  if (cached !== null) {
    stars.value = cached;
    return;
  }
  try {
    const res = await fetch(`https://api.github.com/repos/cody1996/fake-steps`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return;
    const data = (await res.json()) as { stargazers_count?: number };
    if (typeof data.stargazers_count === 'number') {
      stars.value = data.stargazers_count;
      writeCache(data.stargazers_count);
    }
  } catch {
    /* 离线或限流时忽略，只显示按钮 */
  }
});
</script>

<template>
  <a class="gh-star" :href="REPO" target="_blank" rel="noopener noreferrer" title="在 GitHub 上 Star 这个项目">
    <PhStar :size="15" :stroke-width="1.6" weight="regular" />
    <span class="label">Star</span>
    <span v-if="stars !== null && stars > 0" class="count">{{ stars }}</span>
  </a>
</template>

<style scoped>
.gh-star {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 34px;
  padding: 0 11px;
  border: 1px solid #e2e5ea;
  border-radius: 9px;
  background: #fff;
  color: #14161a;
  font-size: 12.5px;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.15s, border-color 0.15s;
}
.gh-star:hover {
  background: #f7f8fa;
  border-color: #c9ced6;
}
.count {
  font-weight: 500;
  color: #6b7280;
  font-variant-numeric: tabular-nums;
}
@media (max-width: 420px) {
  .label {
    display: none;
  }
}
</style>
