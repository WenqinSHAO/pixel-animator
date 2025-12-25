/**
 * Core configuration constants for the pixel animator.
 */

/** Internal frame resolution (frames stored as W*H bytes) */
export const W = 128;

/** Internal frame resolution (frames stored as W*H bytes) */
export const H = 128;

/** Visible canvas / GIF export resolution (can be larger than W to upscale) */
export const DISPLAY = 512;

/** Playback and GIF framerate (used for playback interval and GIF frame delay) */
export const FPS = 12;

/** Maximum number of frames allowed in a project */
export const MAX_FRAMES = 600;

/** Maximum number of undo steps to keep per frame */
export const UNDO_LIMIT = 100;
