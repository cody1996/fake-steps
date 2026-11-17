import type { ScheduledDay } from '../core/types';
import { downloadBlob, renderPng } from './render';

export interface ExportProgress {
  done: number;
  total: number;
  current: string;
}

const fileName = (day: ScheduledDay) => `steps-${day.record.date}.png`;

/** 把所有图片渲染成 File，缓存在内存里，供后续下载/分享复用。 */
export async function renderFiles(
  days: ScheduledDay[],
  onProgress: (p: ExportProgress) => void,
): Promise<File[]> {
  const files: File[] = [];
  for (let i = 0; i < days.length; i += 1) {
    const day = days[i];
    onProgress({ done: i, total: days.length, current: day.record.date });
    const blob = await renderPng(day.record, day.template);
    files.push(new File([blob], fileName(day), { type: 'image/png' }));
  }
  onProgress({ done: days.length, total: days.length, current: '完成' });
  return files;
}

/**
 * 逐张保存：必须在用户点击的同一轮事件里同步触发，
 * 中间不要 await，否则浏览器会把后续下载当成「非用户操作」拦掉。
 */
export function downloadFiles(files: File[]): void {
  for (const file of files) downloadBlob(file, file.name);
}

/** 当前环境能否调用系统分享面板（支持多文件） */
export function canShareImages(): boolean {
  if (typeof navigator === 'undefined' || !navigator.canShare) return false;
  try {
    const probe = new File([new Blob(['x'], { type: 'image/png' })], 'probe.png', {
      type: 'image/png',
    });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

/**
 * 调系统分享面板（iOS 可直接「存储图像」到相册）。
 * 注意：必须在点击事件里同步调用，不能先 await 渲染，否则会报
 * "Must be handling a user gesture"。所以调用方要保证 files 已经准备好。
 */
export function shareFiles(files: File[]): Promise<void> {
  return navigator.share({ files, title: '步数截图' });
}
