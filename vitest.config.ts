import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 线程池不依赖子进程，沙箱 / CI 里更稳
    pool: 'threads',
    include: ['tests/**/*.test.ts'],
  },
});
