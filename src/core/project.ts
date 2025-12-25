/**
 * Project save/load functionality for importing and exporting animation projects.
 */

import type { Frame, ProjectData } from '../types';
import { W, H, FPS, MAX_FRAMES } from './config';
import { makeBlankFrame } from './frame';
import { clamp } from '../utils/helpers';

/**
 * Save project as JSON file.
 */
export function saveProject(frames: Frame[]): void {
  const project: ProjectData = {
    version: '1.3',
    width: W,
    height: H,
    fps: FPS,
    frameCount: frames.length,
    timestamp: new Date().toISOString(),
    frames: frames.map(f => {
      let binary = '';
      for (let i = 0; i < f.length; i++) binary += String.fromCharCode(f[i]);
      return btoa(binary);
    })
  };

  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: 'application/json' });

  const a = document.createElement('a');
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  a.download = `animation-project-${ts}.json`;
  a.href = URL.createObjectURL(blob);

  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

/**
 * Load project from JSON file.
 */
export async function loadProject(file: File): Promise<Frame[]> {
  const text = await file.text();
  const project: ProjectData = JSON.parse(text);

  if (!project || !project.frames || !Array.isArray(project.frames)) {
    throw new Error('Invalid project file format');
  }
  if (project.width !== W || project.height !== H) {
    throw new Error(
      `Project dimensions (${project.width}×${project.height}) don't match canvas (${W}×${H})`
    );
  }

  const nextCount = clamp(Number(project.frameCount || project.frames.length || 1), 1, MAX_FRAMES);

  const frames: Frame[] = Array.from({ length: nextCount }, () => makeBlankFrame());

  for (let i = 0; i < nextCount; i++) {
    if (i < project.frames.length) {
      const base64 = project.frames[i];
      const binary = atob(base64);
      if (binary.length !== W * H) {
        throw new Error(`Frame ${i + 1} has invalid length (${binary.length}); expected ${W * H}`);
      }
      const arr = new Uint8Array(binary.length);
      for (let j = 0; j < binary.length; j++) arr[j] = binary.charCodeAt(j);
      frames[i].set(arr);
    } else {
      frames[i].fill(255);
    }
  }

  return frames;
}
