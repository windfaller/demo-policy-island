/* ---------- 遠景 ---------- */
const mountainMeshes = [], clouds = [];
let cloudMesh = null;
if (STAGE >= 2) {
  const camDir = new V3(.24, .33, .87).normalize();
  const fbm = (x, z) => { let a = 0, f = 1, w = .5; for (let o = 0; o < 4; o++) { a += w * noise.noise(x * f, z * f); f *= 2; w *= .5; } return a * .5 + .5; };
  const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const H = (x, z) => { const r = Math.hypot(x, z), ring = sstep(25, 50, r), n = fbm(x * .035, z * .035);
    let h = ring * (4 + n * 10) - 1.6 * (1 - ring) + (n - .5) * 1.2;
    const side = sstep(.15, .85, (x * camDir.x + z * camDir.z) / (r + 1e-3)); h = h * (1 - .8 * side) - side * .4 * (1 - ring);
    const tq = Math.floor(h / .7) * .7; return h > .3 ? h * .4 + tq * .6 : h; };
  const tg = new THREE.PlaneGeometry(170, 170, 160, 160).rotateX(-Math.PI / 2), tp = tg.attributes.position, cols = new Float32Array(tp.count * 3);
  const stops = [[-.2, '#8fb3ad'], [.5, '#d9c9a3'], [1.6, '#aec493'], [3.5, '#a3b986'], [6.5, '#6f8a62'], [9, '#b2a38d']].map(([h, c]) => [h, C(c)]);
  const tc = new THREE.Color();
  for (let i = 0; i < tp.count; i++) { const x = tp.getX(i), z = tp.getZ(i), h = H(x, z); tp.setY(i, h);
    let k = 0; while (k < stops.length - 1 && h > stops[k + 1][0]) k++; const a = stops[k], b = stops[Math.min(k + 1, stops.length - 1)];
    tc.copy(a[1]).lerp(b[1], b === a ? 0 : Math.min(1, Math.max(0, (h - a[0]) / (b[0] - a[0])))); cols.set([tc.r, tc.g, tc.b], i * 3); }
  tg.setAttribute('color', new THREE.BufferAttribute(cols, 3)); tg.computeVertexNormals();
  const terrain = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .95 })); terrain.position.set(center.x, WATER_Y - .25, center.z); terrain.receiveShadow = true; scene.add(terrain);
  // 背景樹
  const coniG = BGU.mergeGeometries([new THREE.ConeGeometry(.7, 1.1, 7).translate(0, .8, 0), new THREE.ConeGeometry(.55, .9, 7).translate(0, 1.4, 0), new THREE.ConeGeometry(.38, .7, 7).translate(0, 1.9, 0)]);
  const tj = mulberry32(3); const icos = []; for (let i = 0; i < 4; i++) icos.push(new THREE.IcosahedronGeometry(.45 + tj() * .25, 0).translate((tj() - .5) * .6, .9 + tj() * .6, (tj() - .5) * .6));
  const broadG = BGU.mergeGeometries(icos);
  const NT = isMobile ? 1100 : 3200, treeMat = new THREE.MeshStandardMaterial({ flatShading: true, roughness: .9 });
  const imC = new THREE.InstancedMesh(coniG, treeMat, NT / 2), imB = new THREE.InstancedMesh(broadG, treeMat, NT / 2);
  let ci = 0, bi = 0, guard = 0; const tm = new THREE.Matrix4(), tq = new THREE.Quaternion();
  const tcol = [C('#6f8a62'), C('#728f5f'), C('#5d7a55'), C('#8db86f'), C('#9cc27a')];
  while ((ci < NT / 2 || bi < NT / 2) && guard++ < 60000) {
    const a = tj() * Math.PI * 2, r = 16 + tj() * 36, x = Math.cos(a) * r, z = Math.sin(a) * r, h = H(x, z);
    if (h < .35 || h > 9.5) continue; const sc = .5 + tj() * .7; tq.setFromAxisAngle(new V3(0, 1, 0), tj() * 6);
    tm.compose(new V3(center.x + x, WATER_Y - .25 + h - .05, center.z + z), tq, new V3(sc, sc * (.9 + tj() * .4), sc));
    const conifer = h > 4 ? tj() < .7 : tj() < .3;
    if (conifer && ci < NT / 2) { imC.setMatrixAt(ci, tm); imC.setColorAt(ci++, tcol[Math.floor(tj() * 3)]); }
    else if (bi < NT / 2) { imB.setMatrixAt(bi, tm); imB.setColorAt(bi++, tcol[1 + Math.floor(tj() * 4)]); }
  }
  imC.count = ci; imB.count = bi; scene.add(imC, imB);
  // 山坡上的小村落、風車
  const vj = mulberry32(17); let nv = 0, g2 = 0;
  while (nv < (isMobile ? 70 : 160) && g2++ < 20000) { const a = vj() * Math.PI * 2, r = 20 + vj() * 32, x = Math.cos(a) * r, z = Math.sin(a) * r, h = H(x, z);
    if (h < .6 || h > 5.5) continue; const m = new THREE.Matrix4().compose(new V3(center.x + x, WATER_Y - .25 + h, center.z + z), new THREE.Quaternion().setFromAxisAngle(new V3(0, 1, 0), vj() * 6), new V3(1, 1, 1).multiplyScalar(.6 + vj() * .5));
    const b = builder(kit, m, { type: 'decor' }, vj); b.bx(0, 0, 0, .8, .55, .7, ['#f4ebdd', '#fff8f4', '#efe0c8'][nv % 3]); b.hp(0, .55, 0, .9, .4, .8, [PAL.coral, PAL.teal, PAL.eave, PAL.indigo][nv % 4]); b.gb(0, .18, .351, .18, .16, .01); nv++; }
  for (let k = 0; k < 4; k++) { const a = -.9 + k * .65, r = 30 + k * 3, x = Math.cos(a) * r, z = -Math.abs(Math.sin(a)) * r; const h = Math.max(.5, H(x, z));
    const b = builder(kit, new THREE.Matrix4().makeTranslation(center.x + x, WATER_Y - .25 + h, center.z + z), { type: 'decor' }, vj); b.cy(0, 0, 0, .3, 2.4, '#ffffff'); b.co(0, 2.4, 0, .34, .3, PAL.coral);
    for (let i = 0; i < 3; i++) b.add('box', 0, 2.4 + Math.cos(i * 2.094) * .75, .35 + 0, .14, 1.5, .04, PAL.cream, 0, 0, i * 2.094); }

  // 三圈遠山
  [[92, 10, .35], [112, 15, .55], [134, 22, .75]].forEach(([rad, hmax, mix], ri) => {
    const N = 120, pos = [], idx = [];
    for (let i = 0; i <= N; i++) { const a = i / N * Math.PI * 2, h = hmax * (.45 + .55 * (noise.noise(Math.cos(a) * 2 + ri * 7, Math.sin(a) * 2) * .5 + .5));
      pos.push(Math.cos(a) * rad, -2, Math.sin(a) * rad, Math.cos(a) * rad, h, Math.sin(a) * rad); if (i < N) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: '#8aa38a', side: THREE.DoubleSide, fog: false })); m.position.copy(center); m.userData.mix = mix; m.userData.base = C(['#7f9a7c', '#93a69a', '#a9b4b4'][ri]); scene.add(m); mountainMeshes.push(m);
  });
  // 雲
  const cj = mulberry32(8), puffs = [];
  for (let c = 0; c < 12; c++) { const cx = -90 + cj() * 180, cy = 14 + cj() * 10, cz = -70 + cj() * 75, n = 5 + Math.floor(cj() * 3), offs = [];
    for (let i = 0; i < n; i++) offs.push([(i - n / 2) * 1.4 + cj(), cj() * 1.2, (cj() - .5) * 2, 1.4 + cj() * 1.4]);
    clouds.push({ x: cx, y: cy, z: cz, offs, sp: .25 + cj() * .25 }); puffs.push(...offs); }
  cloudMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 10), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, emissive: '#ffffff', emissiveIntensity: .25 }), puffs.length); scene.add(cloudMesh);
}
function updateClouds(dt) {
  if (!cloudMesh) return; let k = 0;
  clouds.forEach(c => { c.x += c.sp * dt; if (c.x > 95) c.x = -95;
    c.offs.forEach(o => { _m.compose(_p.set(center.x + c.x + o[0], c.y + o[1], center.z + c.z + o[2]), _q.identity(), _s.set(o[3], o[3] * .7, o[3])); cloudMesh.setMatrixAt(k++, _m); }); });
  cloudMesh.instanceMatrix.needsUpdate = true;
}
updateClouds(0);
/* ---------- 動態點綴：船、鳥群、熱氣球（零件同樣實例化） ---------- */
const dyn = [], dynMeshes = [];
function dynObj(build, upd) { const K = makeKit(), b = builder(K, new THREE.Matrix4(), {}, mulberry32(dyn.length + 3)); build(b); dyn.push({ parts: K.parts, upd, M: new THREE.Matrix4(), ph: dyn.length * 1.7 }); }
if (STAGE >= 2) {
  for (let i = 0; i < 6; i++) { const r = 11.5 + i * .9, sp = (.05 + (i % 3) * .015) * (i % 2 ? 1 : -1), a0 = i * 1.05, sail = i % 2 === 0;
    dynObj(b => { b.rb(0, 0, 0, .3, .12, .8, ['#ffffff', PAL.coral, PAL.teal][i % 3]); b.bx(0, .12, -.05, .26, .02, .5, PAL.wood);
      if (sail) { b.cy(0, .1, .05, .015, .9, PAL.wood); b.add('prism', 0, .55, .12, .02, .7, .4, PAL.cream, 0); } else { b.rb(0, .12, -.12, .18, .16, .22, '#ffffff'); b.gb(0, .18, -.005, .14, .06, .01); } },
      (t, M) => { const a = a0 + t * sp, x = center.x + Math.cos(a) * r, z = center.z + Math.sin(a) * r * .85; const hd = Math.atan2(-Math.sin(a) * sp, Math.cos(a) * sp * .85);
        M.compose(_p.set(x, WATER_Y + .02 + Math.sin(t * 1.6 + i) * .02, z), _q.setFromEuler(_e.set(Math.sin(t * 1.3 + i) * .05, Math.atan2(-Math.sin(a) * Math.sign(sp), Math.cos(a) * Math.sign(sp)), 0)), _s.set(1, 1, 1)); }); }
  for (let f = 0; f < 3; f++) for (let i = 0; i < 6; i++) { const r = 5 + f * 3, h = 4.5 + f * 1.2 + (i % 3) * .25, sp = .18 + f * .04, off = i * .17 + (i % 2) * .05;
    dynObj(b => { b.sp(0, 0, 0, .05, '#ffffff'); const l = b.add('box', -.12, 0, 0, .22, .012, .08, '#f6f2ec'); l.anim = 1; const rr = b.add('box', .12, 0, 0, .22, .012, .08, '#f6f2ec'); rr.anim = -1; b.co(0, -.01, .07, .02, .05, PAL.yellow); },
      (t, M) => { const a = f * 2 + t * sp + off; M.compose(_p.set(center.x + Math.cos(a) * r, h + Math.sin(t + i) * .1, center.z + Math.sin(a) * r), _q.setFromAxisAngle(_e.set(0, 1, 0) && new V3(0, 1, 0), -a), _s.set(1.6, 1.6, 1.6)); }); }
  dynObj(b => { b.sp(0, 1.1, 0, .55, PAL.coral); b.add('sphere', 0, 1.1, 0, 1.12, 1.05, .5, PAL.yellow); b.co(0, .45, 0, .3, .4, PAL.coral); b.bx(0, 0, 0, .2, .16, .2, PAL.wood); b.gs(0, .3, 0, .05); },
    (t, M) => M.makeTranslation(center.x - 12 + Math.sin(t * .03) * 8, 9 + Math.sin(t * .2) * .4, center.z - 14 + Math.cos(t * .025) * 3));
  const grp = {}; dyn.forEach(d => d.parts.forEach(p => (grp[p.kind] = grp[p.kind] || []).push(p)));
  for (const k in grp) { const im = new THREE.InstancedMesh(GEO[k], k.startsWith('glow') ? glowMat : solidMat, grp[k].length); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false;
    grp[k].forEach((p, i) => { p.mesh = im; p.idx = i; im.setColorAt(i, p.color); }); scene.add(im); dynMeshes.push(im); }
}
const _dm = new THREE.Matrix4(), _dr = new THREE.Matrix4();
function updateDyn(t) {
  for (const d of dyn) { d.upd(t, d.M); for (const p of d.parts) { if (p.anim) { _dr.makeRotationZ(p.anim * Math.sin(t * 11 + d.ph) * .6); _dm.multiplyMatrices(d.M, _dr).multiply(p.matrix); } else _dm.multiplyMatrices(d.M, p.matrix); p.mesh.setMatrixAt(p.idx, _dm); } }
  dynMeshes.forEach(m => m.instanceMatrix.needsUpdate = true);
}
updateDyn(0);
finalizeKit(kit, { cast: true, pick: true });
finalizeKit(smallKit, { cast: false, pick: false });
// 路燈光池（加法混合）
let pools = null;
if (lamps.length) {
  pools = new THREE.InstancedMesh(new THREE.CircleGeometry(.42, 20).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffcf7a', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 }), lamps.length + Object.keys(itemRec).length);
  let k = 0; lamps.forEach(p => { _m.makeTranslation(p.x, p.y, p.z); pools.setMatrixAt(k++, _m); });
  Object.values(itemRec).forEach(r => { _m.compose(_p.set(r.pos.x, TOP + .016, r.pos.z + .35), _q.identity(), _s.set(.7, 1, .5)); pools.setMatrixAt(k++, _m); });
  scene.add(pools);
}

/* ---------- 日夜 ---------- */
const KF = [
  [0, '0e1a3c', '22305e', '9fb4ff', .45, '6a80c8', '2a2c48', .7, 1, '2c4a78'],
  [300, '142046', '2c3866', 'a4b8ff', .45, '6e84cc', '2c2e4a', .75, 1, '2e4c7a'],
  [360, '7f8fc4', 'f6c3a6', 'ffb48a', 1.3, 'f3c6b5', '6b5a5a', 1.1, .55, '8fb7c4'],
  [450, 'a9d1ea', 'fbe6d3', 'ffe2c4', 2.4, 'eaf2f6', '8a7a68', 1.25, 0, '9fcfd6'],
  [720, '9fd0ec', 'f4eee3', 'fff1de', 2.9, 'eef6fa', '8f8270', 1.35, 0, 'a9d8db'],
  [960, 'a6cfe6', 'f8e7d2', 'ffe3c0', 2.5, 'f1efe8', '8a7a66', 1.25, 0, '9fcbd2'],
  [1065, '8b8fc4', 'f7b98f', 'ff9f6a', 1.8, 'f6d2bc', '7d6660', 1.2, .3, '93a9bd'],
  [1140, '5a5e9e', 'd99aa6', 'ff9a7a', 1.3, 'c0b2e0', '655868', 1.35, .75, '6a7cab'],
  [1260, '101c40', '26346a', 'a4b8ff', .5, '6a80c8', '2a2c48', .75, 1, '2c4a78']
].map(k => k.map(v => typeof v === 'string' ? C('#' + v) : v));
KF.push([1440, ...KF[0].slice(1)]);
const env = { night: 0 };
const deepRatio = C('#6fa9b8'), lightRef = C('#a4d4da');
function applyTime(min) {
  min = ((min % 1440) + 1440) % 1440; let i = 0; while (KF[i + 1][0] <= min) i++;
  const a = KF[i], b = KF[i + 1], f = (min - a[0]) / (b[0] - a[0]);
  const lc = (k) => a[k].clone().lerp(b[k], f), ln = (k) => a[k] + (b[k] - a[k]) * f;
  skyU.uTop.value.copy(lc(1)); skyU.uHorizon.value.copy(lc(2)); scene.fog.color.copy(skyU.uHorizon.value);
  sun.color.copy(lc(3)); sun.intensity = ln(4); skyU.uSun.value.copy(sun.color);
  hemi.color.copy(lc(5)); hemi.groundColor.copy(lc(6)); hemi.intensity = ln(7);
  const night = ln(8); env.night = night; skyU.uNight.value = night;
  const w = lc(9); waterU.uLight.value.copy(w); waterU.uDeep.value.setRGB(w.r * deepRatio.r / lightRef.r, w.g * deepRatio.g / lightRef.g, w.b * deepRatio.b / lightRef.b);
  // 太陽方位（量化到 10 分鐘）
  const qm = Math.floor(min / 10) * 10, t = Math.min(1, Math.max(0, (qm - 360) / 720)), az = Math.PI * (.15 + .7 * t), el = .35 + Math.sin(t * Math.PI) * .75;
  const dir = new V3(Math.cos(az) * Math.cos(el), Math.sin(el), .55 * Math.cos(el) + .35).normalize();
  sun.position.copy(center).addScaledVector(dir, 40); skyU.uSunDir.value.copy(dir);
  glowMat.emissiveIntensity = night * 5.5; renderer.toneMappingExposure = 1 - night * .22; if (pools) pools.material.opacity = night * .55;
  mountainMeshes.forEach(m => m.material.color.copy(m.userData.base).multiplyScalar(1 - night * .55).lerp(skyU.uHorizon.value, m.userData.mix));
}

/* ---------- 標籤 ---------- */
const islandLabels = islands.map(s => {
  const el = document.createElement('div'); el.className = 'ilabel';
  el.innerHTML = `<span class="num">${String(s.i + 1).padStart(2, '0')}</span><span class="nm">${tr(s.d.name, s.d.en)}</span>`;
  const o = new CSS2DObject(el); o.position.set(s.c.x, TOP - .05, s.c.z + R * SQ3 / 2 + .05); scene.add(o);
  el.addEventListener('click', e => { e.stopPropagation(); if (STAGE >= 3) select('island', s.i); });
  return { el, o, mode: 'full', prio: 0 };
});

/* ---------- 相機 ---------- */
const PANO_DIR = new V3(.24, .33, .87).normalize();
function panoDist() { const a = innerWidth / innerHeight, base = a > 1.3 ? 28.5 : a > .8 ? 38 : 56, hf = Math.atan(Math.tan(16 * Math.PI / 180) * a); return Math.min(a < .8 ? 76 : 68, Math.max(base, (a < .8 ? 9.2 : 9.5) / Math.tan(hf))); }
camera.position.copy(center).addScaledVector(PANO_DIR, panoDist()); controls.target.copy(center); controls.update();
let flight = null, dirty = true;
const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function flyTo(pos, tgt) {
  if (RM) { camera.position.copy(pos); controls.target.copy(tgt); controls.update(); dirty = true; return; }
  flight = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos, t1: tgt, start: performance.now() };
}
function cardShift() { return STAGE >= 3 && !isMobileNow() && $('#card').classList.contains('open'); }
function isMobileNow() { return matchMedia('(max-width:800px)').matches; }
function flyFocus(pt, off) {
  const offset = new V3(...off), tgt = pt.clone();
  if (cardShift()) { const right = new V3().crossVectors(offset.clone().negate(), new V3(0, 1, 0)).normalize(); tgt.addScaledVector(right, -1.5); }
  flyTo(tgt.clone().add(offset), tgt);
}
function goPano() { state.bird = false; setPressed('bird', false); controls.minPolarAngle = 25 * Math.PI / 180; flyTo(center.clone().addScaledVector(PANO_DIR, panoDist()), center.clone()); }
renderer.domElement.addEventListener('pointerdown', () => { flight = null; });
