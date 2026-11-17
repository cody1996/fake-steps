import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  // 相对路径：既能部署在根域名，也能部署在 GitHub Pages 的 /仓库名/ 子路径下
  base: './',
  plugins: [vue()],
  server: { port: 5173, strictPort: true },
  build: {
    target: 'esnext',
    assetsInlineLimit: 0,
  },
});
