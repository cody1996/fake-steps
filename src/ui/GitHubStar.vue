<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { PhGithubLogo } from '@phosphor-icons/vue';

const REPO = 'https://github.com/cody1996/fake-steps';
const stars = ref<number | null>(null);

onMounted(async () => {
  // 只是想显示个数字，拿不到就算了，不影响页面
  try {
    const res = await fetch('https://api.github.com/repos/cody1996/fake-steps', {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return;
    const data = (await res.json()) as { stargazers_count?: number };
    if (typeof data.stargazers_count === 'number') stars.value = data.stargazers_count;
  } catch {
    /* 离线或限流时忽略 */
  }
});
</script>

<template>
  <a class="gh-star" :href="REPO" target="_blank" rel="noopener noreferrer" title="在 GitHub 上 Star 这个项目">
    <PhGithubLogo :size="16" weight="fill" />
    <span class="label">Star</span>
    <span v-if="stars !== null" class="count">{{ stars }}</span>
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
  padding-left: 6px;
  margin-left: 1px;
  border-left: 1px solid #e8eaee;
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
