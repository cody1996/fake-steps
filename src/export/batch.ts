import type { ScheduledDay } from '../core/types';
import { downloadBlob, renderPng } from './render';

export interface ExportProgress {
  done: number;
  total: number;
  current: string;
}

const fileName = (day: ScheduledDay) => `steps-${day.record.date}.png`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * 逐张保存（不打包）：先把所有图渲染好，再在同一个用户手势里连续触发下载。
 * 桌面浏览器与 Android Chrome 会一次性存到「下载」目录（Chrome 可能弹一次“下载多个文件”）。
 */
export async function exportFiles(
  days: ScheduledDay[],
  onProgress: (p: ExportProgress) => void,
): Promise<number> {
  const blobs: { blob: Blob; name: string }[] = [];
  for (let i = 0; i < days.length; i += 1) {
    const day = days[i];
    onProgress({ done: i, total: days.length, current: day.record.date });
    const blob = await renderPng(day.record, day.template);
    blobs.push({ blob, name: fileName(day) });
  }

  onProgress({ done: days.length, total: days.length, current: '保存中' });
  for (const item of blobs) {
    downloadBlob(item.blob, item.name);
    // 给浏览器一点时间去处理下载队列，太快会被吞掉
    await sleep(180);
  }
  return blobs.length;
}

/** 当前环境能否直接调用系统分享面板（iOS Safari / Android Chrome 都支持） */
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
 * 调用系统分享面板一次性发出多张 PNG（iOS 上可直接「存储图像」到相册），
 * 这是手机上最省事的批量保存方式。
 */
export async function shareImages(
  days: ScheduledDay[],
  onProgress: (p: ExportProgress) => void,
): Promise<void> {
  const files: File[] = [];
  for (let i = 0; i < days.length; i += 1) {
    const day = days[i];
    onProgress({ done: i, total: days.length, current: day.record.date });
    const blob = await renderPng(day.record, day.template);
    files.push(new File([blob], fileName(day), { type: 'image/png' }));
  }

  if (!navigator.canShare?.({ files })) {
    throw new Error('当前浏览器不支持一次分享多张图片，请改用「逐张保存」');
  }
  await navigator.share({ files, title: '步数截图' });
}
