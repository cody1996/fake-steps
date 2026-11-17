import { renderPng } from './export/render';
import { REF_HISTORY, REF_TODAY } from './ui/useCapture';

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function save(blob: Blob, name: string): Promise<number> {
  try {
    const res = await fetch(`/save?name=${name}`, { method: 'POST', body: blob });
    const json = await res.json();
    return json.bytes ?? 0;
  } catch {
    return 0;
  }
}

/** 浏览器内自检：真实跑一遍导出管线，把 PNG 回传落盘，并显示在页面上。 */
export async function runSelfTest(): Promise<void> {
  const root = document.getElementById('app');
  if (!root) return;

  const t0 = performance.now();
  const history = await renderPng(REF_HISTORY, 'history');
  const today = await renderPng(REF_TODAY, 'today');
  const ms = Math.round(performance.now() - t0);

  const hb = await save(history, 'export-history.png');
  const tb = await save(today, 'export-today.png');

  const dataUrl = await toBase64(history);
  const img = new Image();
  img.src = dataUrl;
  await img.decode();

  const meta = `history ${(history.size / 1024).toFixed(0)}KB ${img.naturalWidth}x${img.naturalHeight} saved=${hb} | today ${(today.size / 1024).toFixed(0)}KB saved=${tb} | ${ms}ms`;
  document.title = 'SELFTEST ' + meta;

  const view = document.createElement('img');
  view.src = dataUrl;
  view.style.cssText = 'width:393px;height:853.3333px;display:block;border:1px solid #ddd';

  const p = document.createElement('pre');
  p.id = 'selftest-meta';
  p.textContent = meta;

  root.append(p, view);
}
