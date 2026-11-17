import JSZip from 'jszip';
import type { ScheduledDay } from '../core/types';
import { renderPng, downloadBlob } from './render';
import type { ExportProgress } from './batch';

/** 逐日渲染并打包成 ZIP，串行执行以避免内存峰值。 */
export async function exportZip(
  days: ScheduledDay[],
  onProgress: (p: ExportProgress) => void,
): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder('steps') ?? zip;

  for (let i = 0; i < days.length; i += 1) {
    const day = days[i];
    onProgress({ done: i, total: days.length, current: day.record.date });
    const blob = await renderPng(day.record, day.template);
    folder.file(`steps-${day.record.date}.png`, blob);
  }

  onProgress({ done: days.length, total: days.length, current: '打包中' });
  const out = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
  const first = days[0]?.record.date ?? 'start';
  const last = days[days.length - 1]?.record.date ?? 'end';
  downloadBlob(out, `steps-${first}_${last}.zip`);
}
