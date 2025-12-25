const validateProject = require('../lib/validateProject');

function b64FromBytes(arr){ return Buffer.from(arr).toString('base64'); }

describe('validateProject', ()=>{
  test('valid project passes', ()=>{
    const project = { width:2, height:2, fps:12, frameCount:1, frames: [ b64FromBytes([0,1,2,3]) ] };
    const res = validateProject(project, { width:2, height:2, fps:12 });
    expect(res.ok).toBe(true);
    expect(res.errors.length).toBe(0);
  });

  test('frameCount mismatch detected', ()=>{
    const project = { width:2, height:2, fps:12, frameCount:2, frames: [ b64FromBytes([0,1,2,3]) ] };
    const res = validateProject(project, { width:2, height:2, fps:12 });
    expect(res.ok).toBe(false);
    expect(res.errors.join(' ')).toMatch(/frameCount/);
  });

  test('invalid base64 detected', ()=>{
    const project = { width:2, height:2, fps:12, frameCount:1, frames: [ 'not-base64!!' ] };
    const res = validateProject(project, { width:2, height:2, fps:12 });
    expect(res.ok).toBe(false);
    expect(res.errors.join(' ')).toMatch(/invalid base64/);
  });

  test('frame length mismatch detected', ()=>{
    const project = { width:2, height:2, fps:12, frameCount:1, frames: [ b64FromBytes([1,2]) ] };
    const res = validateProject(project, { width:2, height:2, fps:12 });
    expect(res.ok).toBe(false);
    expect(res.errors.join(' ')).toMatch(/length/);
  });

  test('width/height mismatch against expected', ()=>{
    const project = { width:2, height:2, fps:12, frameCount:1, frames: [ b64FromBytes([0,1,2,3]) ] };
    const res = validateProject(project, { width:3, height:2, fps:12 });
    expect(res.ok).toBe(false);
    expect(res.errors.join(' ')).toMatch(/width mismatch/);
  });

});
