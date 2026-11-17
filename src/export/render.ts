import { createApp } from 'vue';
import { toPng } from 'html-to-image';
import type { DayRecord, TemplateKind } from '../core/types';
import HistoryPage from '../templates/HistoryPage.vue';
import TodayPage from '../templates/TodayPage.vue';

export const ARTBOARD_W = 393;
export const ARTBOARD_H = 853.3333;

/**
 * 把一天的数据渲染成 1179×2560 的 PNG。
 * 离屏挂载 → 等字体就绪 → html-to-image 按 3 倍像素比出图。
 */
export async function renderPng(record: DayRecord, kind: TemplateKind): Promise<Blob> {
  const host = document.createElement('div');
  host.style.cssText = [
    'position:fixed',
    'left:-10000px',
    'top:0',
    `width:${ARTBOARD_W}px`,
    `height:${ARTBOARD_H}px`,
    'overflow:hidden',
    'pointer-events:none',
    'z-index:-1',
  ].join(';');
  document.body.appendChild(host);

  const app = createApp(kind === 'today' ? TodayPage : HistoryPage, { record });
  app.mount(host);

  try {
    await document.fonts.ready;
    await new Promise((resolve) => setTimeout(resolve, 120));

    const node = host.firstElementChild as HTMLElement;
    const dataUrl = await toPng(node, {
      pixelRatio: 3,
      width: ARTBOARD_W,
      // 853.3333 * 3 会取整到 2559，这里补一点点让输出正好 1179×2560
      height: ARTBOARD_H + 0.01,
      cacheBust: true,
      skipAutoScale: true,
    });
    const res = await fetch(dataUrl);
    return await res.blob();
  } finally {
    app.unmount();
    host.remove();
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
