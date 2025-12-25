/**
 * Canvas rendering logic for displaying frames and thumbnails.
 */

import type { Frame } from '../types';
import { W, H, DISPLAY } from './config';
import { clamp } from '../utils/helpers';

/**
 * Calculate ghost gray value for onion skin layer based on distance.
 */
function ghostGrayForDistance(d: number): number {
  return clamp(110 + (d - 1) * 30, 110, 235);
}

/**
 * Compose frame with onion skin layers.
 */
export function composeWithOnionSkin(
  frames: Frame[],
  frameIndex: number,
  depth: number
): ImageData {
  const out = new Uint8ClampedArray(W * H * 4);
  const base = new Uint8Array(W * H);
  base.fill(255);

  // Add onion skin layers (previous frames)
  for (let d = 1; d <= depth; d++) {
    const idx = frameIndex - d;
    if (idx < 0) break;
    const g = ghostGrayForDistance(d);
    const src = frames[idx];
    for (let p = 0; p < src.length; p++) {
      if (src[p] < 250) {
        if (g < base[p]) base[p] = g;
      }
    }
  }

  // Add current frame
  const cur = frames[frameIndex];
  for (let p = 0; p < cur.length; p++) {
    if (cur[p] < base[p]) base[p] = cur[p];
  }

  // Convert to RGBA
  for (let p = 0, o = 0; p < base.length; p++, o += 4) {
    const v = base[p];
    out[o] = v;
    out[o + 1] = v;
    out[o + 2] = v;
    out[o + 3] = 255;
  }

  return new ImageData(out, W, H);
}

/**
 * Compose single frame without onion skin.
 */
export function composeFrameOnly(frames: Frame[], frameIndex: number): ImageData {
  const out = new Uint8ClampedArray(W * H * 4);
  const src = frames[frameIndex];
  
  for (let p = 0, o = 0; p < src.length; p++, o += 4) {
    const v = src[p];
    out[o] = v;
    out[o + 1] = v;
    out[o + 2] = v;
    out[o + 3] = 255;
  }
  
  return new ImageData(out, W, H);
}

/**
 * Render the main canvas with current frame.
 */
export function renderMain(
  mainCanvas: HTMLCanvasElement,
  offCanvas: HTMLCanvasElement,
  frames: Frame[],
  current: number,
  isPlaying: boolean,
  onionDepth: number
): void {
  const ctx = mainCanvas.getContext('2d', { alpha: false, willReadFrequently: true });
  const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
  
  if (!ctx || !offCtx) return;

  const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  const target = DISPLAY * dpr;
  
  if (mainCanvas.width !== target || mainCanvas.height !== target) {
    mainCanvas.width = target;
    mainCanvas.height = target;
    ctx.imageSmoothingEnabled = false;
  }

  const imageData = isPlaying
    ? composeFrameOnly(frames, current)
    : composeWithOnionSkin(frames, current, onionDepth);
  
  offCtx.putImageData(imageData, 0, 0);
  ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(offCanvas, 0, 0, mainCanvas.width, mainCanvas.height);
}

/**
 * Render a thumbnail canvas.
 */
export function renderThumb(
  thumbCanvas: HTMLCanvasElement,
  offCanvas: HTMLCanvasElement,
  frames: Frame[],
  frameIndex: number
): void {
  const tctx = thumbCanvas.getContext('2d', { alpha: false });
  const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
  
  if (!tctx || !offCtx) return;

  tctx.imageSmoothingEnabled = false;
  offCtx.putImageData(composeFrameOnly(frames, frameIndex), 0, 0);
  tctx.clearRect(0, 0, thumbCanvas.width, thumbCanvas.height);
  tctx.drawImage(offCanvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
}
