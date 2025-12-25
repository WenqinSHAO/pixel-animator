// validateProject.js
// Works in Node and the browser (attaches to window.validateProject when available)

function validateProject(project, opts = {}){
  const errors = [];
  if(!project || typeof project !== 'object'){
    errors.push('Invalid project object');
    return { ok: false, errors };
  }

  if(!Array.isArray(project.frames)){
    errors.push('missing frames array');
    return { ok: false, errors };
  }

  const width = Number(project.width);
  const height = Number(project.height);
  if(!Number.isFinite(width) || !Number.isFinite(height)){
    errors.push('invalid width/height');
  }

  if(typeof opts.width !== 'undefined' && Number(opts.width) !== width){
    errors.push(`width mismatch (${width} != ${opts.width})`);
  }
  if(typeof opts.height !== 'undefined' && Number(opts.height) !== height){
    errors.push(`height mismatch (${height} != ${opts.height})`);
  }
  if(typeof opts.fps !== 'undefined' && typeof project.fps !== 'undefined' && Number(project.fps) !== Number(opts.fps)){
    errors.push(`fps mismatch (${project.fps} != ${opts.fps})`);
  }

  const frameCount = Number(project.frameCount || project.frames.length || 0);
  if(frameCount !== project.frames.length){
    errors.push(`frameCount (${frameCount}) does not match frames.length (${project.frames.length})`);
  }

  const expectedLen = (Number.isFinite(width) && Number.isFinite(height)) ? (width * height) : null;
  if(expectedLen !== null){
    for(let i = 0; i < project.frames.length; i++){
      const b64 = project.frames[i];
      if(typeof b64 !== 'string'){
        errors.push(`frame ${i} not a string`);
        break;
      }
      try{
        if(typeof Buffer !== 'undefined' && typeof Buffer.from === 'function' && typeof window === 'undefined'){
          const buf = Buffer.from(b64, 'base64');
          // Buffer.from doesn't throw for many invalid inputs, so verify round-trip equality
          const re = buf.toString('base64').replace(/=+$/,'');
          const orig = String(b64).replace(/=+$/,'');
          if(re !== orig){ errors.push(`frame ${i} invalid base64`); break; }
          if(buf.length !== expectedLen){ errors.push(`frame ${i} length ${buf.length} != ${expectedLen}`); break; }
        }else{
          // browser-ish environment
          const bin = atob(b64);
          if(bin.length !== expectedLen){ errors.push(`frame ${i} length ${bin.length} != ${expectedLen}`); break; }
        }
      }catch(e){
        errors.push(`frame ${i} invalid base64`);
        break;
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

// CommonJS export for Node
if(typeof module !== 'undefined' && module.exports){ module.exports = validateProject; }
// Browser global
if(typeof window !== 'undefined') window.validateProject = validateProject;