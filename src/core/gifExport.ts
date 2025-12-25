/**
 * GIF export functionality using gif.js library.
 */

import type { Frame } from '../types';
import { DISPLAY, FPS } from './config';
import { composeFrameOnly } from './renderer';
import { notify } from '../utils/toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const GIF: any;

let _gifWorkerBlobUrl: string | null = null;

/**
 * Get GIF worker blob URL (tries local vendor first, then CDN fallback).
 */
async function getGifWorkerBlobUrl(): Promise<string> {
  if (_gifWorkerBlobUrl) return _gifWorkerBlobUrl;

  const candidates = [
    './vendor/gif.worker.js',
    './vendor/gif.woker.js',
    'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js'
  ];

  for (const url of candidates) {
    try {
      const resp = await fetch(url);
      if (!resp.ok) continue;
      const text = await resp.text();
      const blob = new Blob([text], { type: 'application/javascript' });
      _gifWorkerBlobUrl = URL.createObjectURL(blob);
      console.info('Loaded gif.worker from', url);
      return _gifWorkerBlobUrl;
    } catch (err) {
      console.warn('Failed to fetch worker from', url, err);
      continue;
    }
  }

  notify('Could not load gif.worker.js. Add ./vendor/gif.worker.js to your project or enable network access.');
  throw new Error('gif.worker.js not available');
}

/**
 * Export animation as GIF file.
 */
export async function saveGif(
  frames: Frame[],
  offCanvas: HTMLCanvasElement,
  onExportStateChange: (isExporting: boolean) => void
): Promise<void> {
  onExportStateChange(true);

  try {
    const workerUrl = await getGifWorkerBlobUrl();

    const gif = new GIF({
      workers: 2,
      quality: 10,
      width: DISPLAY,
      height: DISPLAY,
      repeat: 0,
      workerScript: workerUrl
    });

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = DISPLAY;
    exportCanvas.height = DISPLAY;
    const ectx = exportCanvas.getContext('2d', { alpha: false });
    if (!ectx) throw new Error('Failed to get export canvas context');
    ectx.imageSmoothingEnabled = false;

    const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
    if (!offCtx) throw new Error('Failed to get offscreen canvas context');

    const delay = Math.round(1000 / FPS);

    for (let i = 0; i < frames.length; i++) {
      offCtx.putImageData(composeFrameOnly(frames, i), 0, 0);

      ectx.setTransform(1, 0, 0, 1, 0, 0);
      ectx.clearRect(0, 0, DISPLAY, DISPLAY);
      ectx.fillStyle = '#ffffff';
      ectx.fillRect(0, 0, DISPLAY, DISPLAY);

      ectx.imageSmoothingEnabled = false;
      ectx.drawImage(offCanvas, 0, 0, DISPLAY, DISPLAY);

      gif.addFrame(exportCanvas, { copy: true, delay });
    }

    await new Promise<void>((resolve, reject) => {
      gif.on('finished', (blob: Blob) => {
        const a = document.createElement('a');
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        a.download = `animation-${ts}.gif`;
        a.href = URL.createObjectURL(blob);
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1500);

        // Revoke worker blob URL if we generated it
        if (workerUrl && workerUrl.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(workerUrl);
          } catch (_) {
            // Ignore error
          }
          if (workerUrl === _gifWorkerBlobUrl) _gifWorkerBlobUrl = null;
        }

        onExportStateChange(false);
        resolve();
      });

      gif.on('error', (err: Error) => {
        console.error('GIF render error', err);
        notify(`Failed to render GIF: ${err && err.message ? err.message : String(err)}`);
        
        // Revoke worker url on error
        if (workerUrl && workerUrl.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(workerUrl);
          } catch (_) {
            // Ignore error
          }
          if (workerUrl === _gifWorkerBlobUrl) _gifWorkerBlobUrl = null;
        }
        
        onExportStateChange(false);
        reject(err);
      });

      gif.render();
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('saveGif error', err);
    notify(`Failed to start GIF export: ${errorMsg}`);
    onExportStateChange(false);
  } finally {
    onExportStateChange(false);
  }
}
