#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const EX_DIR = path.join(__dirname, '..', 'example');
const files = fs.readdirSync(EX_DIR).filter(f => f.endsWith('.json'));
if(files.length === 0){
  console.error('No example JSON files found in example/');
  process.exit(1);
}

let ok = true;
for(const f of files){
  const p = path.join(EX_DIR, f);
  let text;
  try{ text = fs.readFileSync(p, 'utf8'); }catch(e){ console.error('Failed to read', p, e); ok = false; continue; }
  let proj;
  try{ proj = JSON.parse(text); }catch(e){ console.error('Invalid JSON:', f, e.message); ok = false; continue; }

  const W = Number(proj.width);
  const H = Number(proj.height);
  const frameCount = Number(proj.frameCount || (proj.frames && proj.frames.length) || 0);
  const frames = Array.isArray(proj.frames) ? proj.frames : [];

  if(frameCount !== frames.length){
    console.error(`${f}: frameCount (${frameCount}) does not match frames.length (${frames.length})`);
    ok = false;
  }

  // Delegate validation to lib/validateProject.js so logic is shared and testable
  const validateProject = require('../lib/validateProject');
  const res = validateProject(proj, { width: W, height: H, fps: proj.fps });
  if(!res.ok){
    console.error(`${f}: ${res.errors.join('; ')}`);
    ok = false;
  } else {
    console.log(`${f}: OK (${frames.length} frames ${W}x${H})`);
  }
}

if(!ok){
  console.error('\nOne or more example files failed validation.');
  process.exit(2);
}
console.log('\nAll example files validated successfully.');
process.exit(0);
