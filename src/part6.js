/* ---------- 標籤碰撞避讓 ---------- */
const _v = new V3();
function rectOf(el) { const r = el.getBoundingClientRect(); return r.width ? r : null; }
function overlaps(a, b, pad) { return a.l - pad < b.right && a.r + pad > b.left && a.t - pad < b.bottom && a.b + pad > b.top; }
function layoutLabels() {
  const panels = ['#brand', '#tools', '#card', '#side', '#hud', '#log', '#legend', '#timeBtn'].map(s => $(s)).filter(e => e && !e.classList.contains('stage-hide')).map(rectOf).filter(Boolean);
  const W = innerWidth, H = innerHeight, placed = [];
  const all = [...pins, ...islandLabels].sort((a, b) => b.prio - a.prio);
  for (const L of all) {
    _v.copy(L.o.position).project(camera); if (_v.z > 1) continue;
    const x = (_v.x * .5 + .5) * W, y = (-_v.y * .5 + .5) * H;
    if (!L.wFull || L.mode === 'full') { L.wFull = L.el.offsetWidth || L.wFull || 80; L.h = L.el.offsetHeight || 26; }
    L.wNum = L.wNum || (L.el.classList.contains('pin') ? 26 : 34);
    const tryMode = (w, pad) => { const r = { l: x - w / 2, r: x + w / 2, t: y - L.h / 2, b: y + L.h / 2 }; if (r.l < 6 || r.r > W - 6 || r.t < 6 || r.b > H - 6) return null; for (const p of panels) if (overlaps(r, p, pad)) return null; for (const p of placed) if (overlaps(r, { left: p.l, right: p.r, top: p.t, bottom: p.b }, pad)) return null; return r; };
    const narrow = W < 600 && !L.el.classList.contains('pin') && L.prio < 1; let mode = 'hide', r = narrow ? null : tryMode(L.wFull, L.mode === 'full' ? 0 : 8);
    if (r) mode = 'full'; else { r = tryMode(L.wNum, L.mode === 'hide' ? 8 : 0); if (r) mode = 'num'; }
    if (r) placed.push(r);
    if (mode !== L.mode) { L.mode = mode; L.el.classList.toggle('numonly', mode === 'num'); L.el.classList.toggle('lhide', mode === 'hide'); }
  }
}

/* ---------- 點擊 / raycast ---------- */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let downXY = null;
renderer.domElement.addEventListener('pointerdown', e => { downXY = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', e => {
  if (!downXY || Math.hypot(e.clientX - downXY[0], e.clientY - downXY[1]) > 6 || STAGE < 3) return;
  const r = renderer.domElement.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, camera);
  const targets = [...islandTops, ...Object.values(kit.meshes)]; if (WPARTS.capsule) targets.push(WPARTS.capsule.im); flowObjs.forEach(f => f.mesh.visible && targets.push(f.mesh));
  const hit = ray.intersectObjects(targets, false)[0]; if (!hit) return;
  const o = hit.object, ud = o.userData;
  if (ud.pick === 'walker') return selectWalker(WPARTS.capsule.owners[hit.instanceId]);
  if (ud.pick === 'flow') return selectFlow(ud.flow);
  if (ud.pick === 'kit') { const ow = ud.owners[hit.instanceId]; if (ow.type === 'item') return selectItem(ow.id); if (ow.island != null) return selectIsland(ow.island); }
  if (ud.pick === 'islandTop' || ud.pick === 'kit') { let bi = -1, bd = 1e9; islands.forEach(s => { const d = Math.hypot(s.c.x - hit.point.x, s.c.z - hit.point.z); if (d < bd) { bd = d; bi = s.i; } }); if (bd < R) selectIsland(bi); }
});

/* ---------- 鍵盤 ---------- */
addEventListener('keydown', e => {
  if (e.target.closest && e.target.closest('input,select,textarea')) return;
  if (e.key === 'Escape') { clearSel(); if ($('#intro').classList.contains('on')) closeIntro(); return; }
  const k = { ArrowLeft: [-.08, 0], ArrowRight: [.08, 0], ArrowUp: [0, -.06], ArrowDown: [0, .06] }[e.key]; if (!k) return;
  e.preventDefault(); flight = null; const off = camera.position.clone().sub(controls.target), sph = new THREE.Spherical().setFromVector3(off);
  sph.theta += k[0]; sph.phi = Math.min(controls.maxPolarAngle, Math.max(controls.minPolarAngle, sph.phi + k[1]));
  camera.position.copy(controls.target).add(new V3().setFromSpherical(sph)); controls.update(); dirty = true;
});

/* ---------- 手機 bottom sheet ---------- */
if (STAGE >= 5) document.querySelectorAll('.handle').forEach(h => {
  const sheet = h.parentElement; let y0 = 0, h0 = 0, on = false;
  h.addEventListener('pointerdown', e => { on = true; y0 = e.clientY; h0 = sheet.getBoundingClientRect().height; h.setPointerCapture(e.pointerId); });
  h.addEventListener('pointermove', e => { if (!on) return; sheet.style.height = Math.min(innerHeight, Math.max(90, h0 + (y0 - e.clientY))) + 'px'; });
  h.addEventListener('pointerup', () => { on = false; const hh = sheet.getBoundingClientRect().height; if (hh > innerHeight * .8) sheet.style.height = '100%'; else if (hh < 110) { if (sheet.id === 'card') clearSel(); else { sheet.classList.add('hide'); $('#bList').setAttribute('aria-pressed', 'false'); } sheet.style.height = ''; } });
});

/* ---------- reduced motion ---------- */
function setRM(v) { RM = STAGE >= 5 && v; flowU.uStatic.value = RM ? 1 : 0; if (RM) flight = null; dirty = true; }
if (STAGE >= 5) rmq.addEventListener('change', e => setRM(e.matches));

/* ---------- 操作說明 ---------- */
function closeIntro() { $('#intro').classList.remove('on'); store.set('policyIsland.introSeen', '1'); }
$('#introOk').onclick = closeIntro; $('#bHelp').onclick = () => $('#intro').classList.add('on');

/* ---------- 尺寸 ---------- */
function resize() { const w = app.clientWidth || innerWidth, h = app.clientHeight || innerHeight; renderer.setSize(w, h); labelR.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); dirty = true; }
new ResizeObserver(resize).observe(app); resize();

/* ---------- 主迴圈 ---------- */
applyTime(state.clock); updateHighlight();
let last = performance.now(), simTime = 0, frame = 0, lastQ = -1, lastSmall = null;
controls.addEventListener('change', () => { dirty = true; });
function tick(now) {
  requestAnimationFrame(tick);
  const dt = Math.min(.08, (now - last) / 1000); last = now;
  const animate = !RM && !state.pause;
  if (flight) { const t = Math.min(1, (now - flight.start) / 800), k = easeIO(t); camera.position.lerpVectors(flight.p0, flight.p1, k); controls.target.lerpVectors(flight.t0, flight.t1, k); if (t >= 1) flight = null; dirty = true; }
  if (controls.update()) dirty = true;
  if (animate) {
    simTime += dt; state.clock = (state.clock + dt * 10) % 1440; waterU.uTime.value = simTime; flowU.uTime.value = simTime; updateClouds(dt); updateDyn(simTime);
    applyTime(state.clock); dirty = true;
  }
  const slot = currentSlot(); if (slot !== state.slot) { state.slot = slot; updateHighlight(); }
  const camD = camera.position.distanceTo(controls.target);
  const small = camD < 26; if (small !== lastSmall) { Object.values(smallKit.meshes).forEach(m => m.visible = small); if (pools) pools.visible = small; lastSmall = small; dirty = true; }
  if (!dirty) return;
  updateWalkers(animate ? dt : 0, simTime, camD);
  sky.position.copy(center);
  renderer.render(scene, camera); labelR.render(scene, camera);
  if (frame++ % 3 === 0) layoutLabels();
  const q = Math.floor(state.clock); if (q !== lastQ) { lastQ = q; $('#clock').textContent = hhmm(state.clock); }
  if (logDirty && state.log && STAGE >= 4) renderLog();
  dirty = false;
}
requestAnimationFrame(tick);
$('#loading').classList.add('done');
if (STAGE >= 5 && !store.get('policyIsland.introSeen')) $('#intro').classList.add('on');
window.__policyIsland = { ready: true, drawCalls: () => renderer.info.render.calls, select, state, items: Object.keys(itemRec).length, walkers: walkers.length };
}
</script>
</body>
</html>
