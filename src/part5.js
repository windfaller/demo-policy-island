/* ================= 狀態與選取 ================= */
const state = { sel: null, names: false, carry: true, flows: false, pause: false, bird: false, log: !isMobile, clock: 600, slot: -1 };
function setPressed(tg, v) { const b = document.querySelector(`[data-tg="${tg}"]`); if (b) b.setAttribute('aria-pressed', String(!!v)); }
const CORAL = C(PAL.coral), YEL = C(PAL.yellow), _c = new THREE.Color();
function currentSlot() { let k = 0; DATA.dayCycle.forEach((s, i) => { if (state.clock % 1440 >= s.start) k = i; }); return k; }
function selItems() {
  const s = state.sel; if (!s) return new Set();
  if (s.type === 'item') return new Set([s.id]);
  if (s.type === 'island') return new Set(islands[s.id].items);
  return new Set();
}
function updateHighlight() {
  const sel = selItems(), lit = STAGE >= 3 ? new Set(DATA.dayCycle[currentSlot()].items) : new Set(), touched = new Set();
  for (const id in itemRec) { const r = itemRec[id];
    r.parts.forEach(p => { _c.copy(p.color); if (lit.has(id)) _c.lerp(YEL, .22); if (sel.has(id)) _c.lerp(CORAL, .22); p.mesh.setColorAt(p.idx, _c); touched.add(p.mesh); }); }
  touched.forEach(m => m.instanceColor.needsUpdate = true); dirty = true;
}
function relatedFlows() {
  const s = state.sel; if (!s) return new Set();
  if (s.type === 'flow') return new Set([s.id]);
  if (s.type === 'walker') return new Set([walkers[s.id].flow.id]);
  const isl = s.type === 'island' ? islands[s.id] : itemRec[s.id].island;
  return new Set(DATA.flows.filter(f => f.from === isl.d.id || f.to === isl.d.id).map(f => f.id));
}
function updateFlows() {
  if (STAGE < 4) return; const rel = relatedFlows(); let any = false;
  flowObjs.forEach(fo => { fo.mesh.visible = state.flows || rel.has(fo.d.id); any = any || fo.mesh.visible; });
  $('#legend').classList.toggle('on', any); dirty = true;
}
function selIsland() { const s = state.sel; if (!s) return -1; if (s.type === 'island') return s.id; if (s.type === 'item') return itemRec[s.id].island.i; return -1; }
function select(type, id) {
  if (STAGE < 3) return;
  if (type === 'walker' && walkers[id].loop) return select('island', walkers[id].amb);
  state.sel = { type, id }; if (state.bird) { state.bird = false; setPressed('bird', false); controls.minPolarAngle = 25 * Math.PI / 180; }
  updateHighlight(); updateFlows(); updateLabelsSel();
  openCard(); // 先開卡片以決定偏移
  if (type === 'island') flyFocus(islands[id].c.clone().setY(TOP), [3.3, 6.9, 7.6]);
  else if (type === 'item') flyFocus(itemRec[id].pos.clone().setY(TOP + .3), [2.1, 3.7, 4.1]);
  else if (type === 'walker') flyFocus(walkers[id].pos.clone(), [2.1, 3.7, 4.1]);
  else if (type === 'flow') { const fo = flowObjs.find(f => f.d.id === id); const mid = fo.pts[Math.floor(fo.pts.length / 2)]; flyFocus(mid.clone(), [3.3, 6.9, 7.6]); }
}
function clearSel() { state.sel = null; $('#card').classList.remove('open'); updateHighlight(); updateFlows(); updateLabelsSel(); }
const selectIsland = i => select('island', i), selectItem = id => select('item', id), selectWalker = i => select('walker', i), selectFlow = id => select('flow', id);

/* ---------- 選島後的 pin ---------- */
let pins = [];
function updateLabelsSel() {
  const si = selIsland();
  islandLabels.forEach((l, i) => { l.el.classList.toggle('sel', i === si); l.el.classList.toggle('dim', si >= 0 && i !== si); l.prio = i === si ? 1 : 0; });
  pins.forEach(p => { scene.remove(p.o); scene.remove(p.line); p.o.element.remove(); }); pins = [];
  if (si < 0) return;
  islands[si].items.forEach((id, k) => { const r = itemRec[id];
    const el = document.createElement('div'); el.className = 'pin'; el.innerHTML = `<span>${CIRC[k]}</span><span class="nm"> ${tr(r.d.name, r.d.en)}</span>`;
    el.addEventListener('click', e => { e.stopPropagation(); selectItem(id); });
    const o = new CSS2DObject(el); o.position.set(r.pos.x, r.top + .55, r.pos.z); scene.add(o);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new V3(r.pos.x, r.top, r.pos.z), new V3(r.pos.x, r.top + .5, r.pos.z)]), new THREE.LineBasicMaterial({ color: PAL.coral, depthTest: false, transparent: true }));
    line.renderOrder = 20; scene.add(line); pins.push({ el, o, line, mode: 'full', prio: 2 }); });
}

/* ---------- 卡片 ---------- */
const thumbCache = {};
let thumbR = null;
function thumbnail(id) {
  if (thumbCache[id]) return thumbCache[id];
  try {
    if (!thumbR) { thumbR = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); thumbR.setSize(160, 160); thumbR.setPixelRatio(1); thumbR.outputColorSpace = THREE.SRGBColorSpace; thumbR.toneMapping = THREE.ACESFilmicToneMapping; }
    const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xeef6fa, 0x8f8270, 1.6)); const dl = new THREE.DirectionalLight(0xfff1de, 2.4); dl.position.set(2, 4, 3); sc.add(dl);
    const K = makeKit(), r = itemRec[id], b = builder(K, new THREE.Matrix4(), {}, mulberry32(1)); (ARCH[r.d.model] || ARCH.house)(b, r.island.d.color); (EXTRA[r.d.model] || noop)(b, r.island.d.color);
    const geos = []; const grp = {}; K.parts.forEach(p => (grp[p.kind] = grp[p.kind] || []).push(p));
    for (const k in grp) { const im = new THREE.InstancedMesh(GEO[k], k.startsWith('glow') ? glowMat : solidMat, grp[k].length); grp[k].forEach((p, i) => { im.setMatrixAt(i, p.matrix); im.setColorAt(i, p.color); }); sc.add(im); geos.push(im); }
    const cam = new THREE.PerspectiveCamera(32, 1, .1, 50); cam.position.set(1.6, 1.9, 2.6); cam.lookAt(0, b.maxY * .42, 0);
    thumbR.render(sc, cam); thumbCache[id] = thumbR.domElement.toDataURL(); geos.forEach(g => g.dispose());
  } catch (e) { thumbCache[id] = ''; }
  return thumbCache[id];
}
function numTiles(facts) {
  const out = [];
  for (const f of facts) { const m = f.match(/(\d[\d,.]*)\s*([%％]|[A-Za-z]+|[^\d\s，,。]{0,2})/); if (m && out.length < 3) out.push({ n: m[1], u: m[2] || '', label: f }); }
  return out;
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const islandName = id => tr(byId[id].d.name, byId[id].d.en);
function flowChip(f) { return `<button class="chip cream" data-flow="${f.id}">${esc(islandName(f.from))} → ${esc(islandName(f.to))}・${esc(tr(f.carryName, f.carryEn))}</button>`; }
function openCard() {
  const s = state.sel, body = $('#cardBody'); if (!s) return; let h = '';
  if (s.type === 'island') { const isl = islands[s.id], d = isl.d;
    h = `<div class="ico">${d.icon}</div><div class="eyebrow" style="margin-top:12px">ISLAND ${String(isl.i + 1).padStart(2, '0')}</div><h2>${esc(tr(d.name, d.en))}</h2><p>${esc(d.summary)}</p>
    <div class="eyebrow">${tr('政策細項', 'POLICIES')}</div>${d.items.map((it, k) => `<button class="itemrow" data-item="${it.id}"><b>${CIRC[k]}</b>${esc(tr(it.name, it.en))}</button>`).join('')}`;
    const fl = DATA.flows.filter(f => f.from === d.id || f.to === d.id);
    if (STAGE >= 4 && fl.length) h += `<div class="eyebrow" style="margin-top:14px">${tr('協作', 'COLLABORATION')}</div><div>${fl.map(flowChip).join('')}</div>`;
  } else if (s.type === 'item') { const r = itemRec[s.id], it = r.d, ph = LANG === 'en' ? DATA.phasesEn : DATA.phases;
    h = `<img class="thumb" alt="" src="${thumbnail(s.id)}"><div class="eyebrow">${esc(tr(r.island.d.name, r.island.d.en))} · ${CIRC[r.num]}</div><h2>${esc(tr(it.name, it.en))}</h2><p>${esc(it.desc)}</p>
    <div class="tiles">${numTiles(it.facts).map(t => `<div class="tile"><div class="n">${esc(t.n)}</div><span class="u">${esc(t.u)}</span><span class="u" title="${esc(t.label)}">${esc(t.label)}</span></div>`).join('')}</div>
    <ul class="facts">${it.facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul><div class="eyebrow">${tr('時程', 'TIMELINE')}</div><div class="timeline">${ph.map((p, i) => `<div class="${i + 1 === it.phase ? 'on' : ''}">${p}</div>`).join('')}</div>
    <button class="chip" style="margin-top:12px" data-island="${r.island.i}">← ${esc(tr(r.island.d.name, r.island.d.en))}</button>`;
  } else { const f = s.type === 'flow' ? DATA.flows.find(x => x.id === s.id) : walkers[s.id].flow, ev = DATA.evidence[f.evidence];
    h = `<div class="eyebrow">${tr('協作線', 'COLLABORATION')}</div><h2>${esc(islandName(f.from))} → ${esc(islandName(f.to))}</h2><span class="ev">${f.evidence.toUpperCase()} · ${esc(tr(ev[0], ev[1]))}</span>
    <p>${esc(f.note)}</p><div class="tiles"><div class="tile"><div class="n">${esc(tr(f.carryName, f.carryEn))}</div><span class="u">${tr('搬運物', 'carrying')}</span></div><div class="tile"><div class="n" style="font-size:18px">${esc(tr(...DATA.roles[f.role]))}</div><span class="u">${tr('角色', 'role')}</span></div></div>
    ${s.type === 'walker' ? `<p>${tr('這位小人正在搬', 'This resident is carrying')} ${esc(tr(f.carryName, f.carryEn))}。</p>` : ''}
    <button class="chip" data-island="${byId[f.from].i}">${esc(islandName(f.from))}</button><button class="chip" data-island="${byId[f.to].i}">${esc(islandName(f.to))}</button>`;
  }
  body.innerHTML = h; body.scrollTop = 0; const card = $('#card'); card.classList.add('open'); if (isMobileNow()) card.style.height = '';
}
$('#cardBody').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.item) selectItem(b.dataset.item); else if (b.dataset.island) selectIsland(+b.dataset.island); else if (b.dataset.flow) selectFlow(b.dataset.flow); });
$('#cardClose').addEventListener('click', clearSel);

/* ---------- 側欄 ---------- */
let tab = 'themes';
function renderList() {
  const q = ($('#search').value || '').trim().toLowerCase(), list = $('#list'); let h = '';
  if (tab === 'themes') {
    islands.forEach(s => { const its = s.d.items.map((it, k) => ({ it, k })).filter(({ it }) => !q || (it.name + it.en + it.desc + s.d.name + s.d.en).toLowerCase().includes(q));
      if (!its.length) return;
      h += `<details ${q ? 'open' : ''}><summary><span class="eyebrow">${String(s.i + 1).padStart(2, '0')}</span>${s.d.icon} ${esc(tr(s.d.name, s.d.en))}</summary><ol>${its.map(({ it, k }) => `<li><button data-item="${it.id}">${CIRC[k]} ${esc(tr(it.name, it.en))}</button></li>`).join('')}</ol></details>`; });
  } else {
    DATA.flows.filter(f => !q || (f.carryName + f.note + byId[f.from].d.name + byId[f.to].d.name).toLowerCase().includes(q)).forEach(f => {
      h += `<button class="flowbtn" data-flow="${f.id}"><b>${esc(islandName(f.from))} → ${esc(islandName(f.to))}</b><br><span style="font-size:12px;color:#7a6a5e">${esc(tr(f.carryName, f.carryEn))} · <span class="ev" style="font-size:9px">${f.evidence}</span></span></button>`; });
  }
  list.innerHTML = h || `<p style="padding:12px;color:#7a6a5e">${tr('找不到符合的項目', 'No matches')}</p>`;
}
$('#list').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.item) selectItem(b.dataset.item); if (b.dataset.flow) selectFlow(b.dataset.flow);
  if (isMobileNow()) { $('#side').classList.add('hide'); $('#bList').setAttribute('aria-pressed', 'false'); } });
$('#list').addEventListener('toggle', () => { dirty = true; }, true);
$('#search').addEventListener('input', renderList);
$('#tabT').onclick = () => { tab = 'themes'; $('#tabT').setAttribute('aria-pressed', 'true'); $('#tabF').setAttribute('aria-pressed', 'false'); renderList(); };
$('#tabF').onclick = () => { tab = 'flows'; $('#tabF').setAttribute('aria-pressed', 'true'); $('#tabT').setAttribute('aria-pressed', 'false'); renderList(); };
$('#bList').onclick = () => { const h = $('#side').classList.toggle('hide'); $('#bList').setAttribute('aria-pressed', String(!h)); $('#side').style.height = ''; };
$('#bPano').onclick = () => { clearSel(); goPano(); };
if (isMobile) { $('#side').classList.add('hide'); $('#bList').setAttribute('aria-pressed', 'false'); }
if (STAGE >= 3) renderList();

/* ---------- HUD ---------- */
document.querySelectorAll('#hud [data-t]').forEach(b => b.onclick = () => { state.clock = +b.dataset.t; applyTime(state.clock); dirty = true; });
document.querySelectorAll('#hud [data-tg]').forEach(b => b.onclick = () => {
  const k = b.dataset.tg; state[k] = !state[k]; b.setAttribute('aria-pressed', String(state[k]));
  if (k === 'flows') updateFlows();
  if (k === 'log') $('#log').classList.toggle('hide', !state.log);
  if (k === 'bird') { if (state.bird) { controls.minPolarAngle = 0; const t = controls.target.clone(); flyTo(t.clone().add(new V3(.01, 42, 6)), t); } else goPano(); }
  dirty = true; });
$('#log').classList.toggle('hide', !state.log); setPressed('log', state.log);
$('#timeBtn').onclick = () => { const o = $('#hud').classList.toggle('mopen'); $('#timeBtn').setAttribute('aria-pressed', String(o)); };

/* ================= 小人與協作線 ================= */
const walkers = [], flowObjs = [], WPARTS = {};
const flowU = { uTime: { value: 0 }, uStatic: { value: RM ? 1 : 0 } };
const badgeTex = {};
function drawIcon(g, kind) {
  g.strokeStyle = PAL.ink; g.fillStyle = PAL.ink; g.lineWidth = 6; g.lineCap = g.lineJoin = 'round'; g.beginPath();
  const S = { book() { g.moveTo(64, 46); g.lineTo(64, 88); g.moveTo(64, 46); g.quadraticCurveTo(48, 38, 36, 44); g.lineTo(36, 84); g.quadraticCurveTo(48, 80, 64, 88); g.quadraticCurveTo(80, 80, 92, 84); g.lineTo(92, 44); g.quadraticCurveTo(80, 38, 64, 46); },
    meal() { g.rect(38, 56, 52, 30); g.moveTo(34, 56); g.lineTo(94, 56); g.moveTo(56, 46); g.lineTo(72, 46); g.moveTo(64, 46); g.lineTo(64, 56); },
    sapling() { g.moveTo(64, 92); g.lineTo(64, 56); g.moveTo(64, 64); g.quadraticCurveTo(44, 62, 42, 44); g.quadraticCurveTo(60, 44, 64, 64); g.moveTo(64, 58); g.quadraticCurveTo(84, 52, 86, 38); g.quadraticCurveTo(68, 38, 64, 58); g.moveTo(50, 92); g.lineTo(78, 92); },
    medkit() { g.rect(36, 48, 56, 40); g.moveTo(54, 48); g.lineTo(54, 40); g.lineTo(74, 40); g.lineTo(74, 48); g.moveTo(64, 58); g.lineTo(64, 78); g.moveTo(54, 68); g.lineTo(74, 68); },
    ball() { g.arc(64, 64, 26, 0, 7); g.moveTo(38, 64); g.lineTo(90, 64); g.moveTo(64, 38); g.quadraticCurveTo(48, 64, 64, 90); g.moveTo(64, 38); g.quadraticCurveTo(80, 64, 64, 90); },
    laptop() { g.rect(42, 42, 44, 30); g.moveTo(32, 84); g.lineTo(96, 84); g.lineTo(88, 74); g.lineTo(40, 74); g.closePath(); },
    ticket() { g.moveTo(34, 48); g.lineTo(94, 48); g.lineTo(94, 58); g.arc(94, 64, 6, -Math.PI / 2, Math.PI / 2, true); g.lineTo(94, 80); g.lineTo(34, 80); g.lineTo(34, 70); g.arc(34, 64, 6, Math.PI / 2, -Math.PI / 2, true); g.closePath(); g.moveTo(74, 52); g.lineTo(74, 76); },
    recycle() { g.arc(64, 64, 24, .3, 2.2); g.moveTo(50, 84); g.lineTo(40, 80); g.lineTo(46, 72); g.moveTo(64, 64); g.arc(64, 64, 24, 2.4, 4.3); g.moveTo(64, 64); g.arc(64, 64, 24, 4.5, 6.1); } };
  (S[kind] || S.book)(); g.stroke();
}
function getBadge(kind) {
  if (badgeTex[kind]) return badgeTex[kind];
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(64, 64, 56, 0, 7); g.fill(); g.strokeStyle = PAL.coral; g.lineWidth = 9; g.beginPath(); g.arc(64, 64, 54, 0, 7); g.stroke();
  drawIcon(g, kind); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return badgeTex[kind] = new THREE.SpriteMaterial({ map: t, depthWrite: false });
}
const SKIN = ['#f3d2b8', '#e8bf9d', '#d9a882'], HAIR = ['#3b2a22', '#5a3b2a', '#211d1d', '#7b5034'];
function rolePartsFor(role, wr) {
  const shirt = [PAL.coral, PAL.aqua, PAL.indigo, PAL.green, PAL.pink][Math.floor(wr() * 5)], skin = SKIN[Math.floor(wr() * 3)];
  let hair = HAIR[Math.floor(wr() * 4)]; const P = [];
  const add = (kind, anim, x, y, z, sx, sy, sz, col, rx = 0, ry = 0, rz = 0) => P.push({ kind, anim, m: new THREE.Matrix4().compose(new V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new V3(sx, sy, sz)), col: C(col) });
  const bike = role === 'commuter';
  add('box', 'legL', 0, -.05, 0, .04, .1, .045, '#4a4458'); add('box', 'legR', 0, -.05, 0, .04, .1, .045, '#4a4458');
  add('box', 'armL', 0, -.045, 0, .028, .09, .03, shirt); add('box', 'armR', 0, -.045, 0, .028, .09, .03, shirt);
  add('capsule', 'body', 0, .155, 0, 1, 1, 1, role === 'researcher' ? '#ffffff' : shirt);
  add('sphere', 'head', 0, .28, 0, .14, .14, .14, skin);
  if (role === 'elder') hair = '#e8e4dc';
  if (role === 'student') add('dome', 'head', 0, .285, 0, .158, .12, .158, PAL.yellow); else add('dome', 'head', 0, .287, -.004, .148, .11, .148, hair);
  add('sphere', 'head', -.024, .285, .066, .014, .018, .01, PAL.ink); add('sphere', 'head', .024, .285, .066, .014, .018, .01, PAL.ink);
  if (role === 'civil') { add('box', 'body', 0, .16, 0, .1, .08, .1, PAL.yellow); add('box', 'body', .022, .17, .052, .025, .03, .006, '#ffffff'); }
  if (role === 'researcher') add('cylinder', 'body', 0, .13, 0, .1, .1, .1, '#ffffff');
  if (role === 'elder') add('cylinder', 'static', .08, .07, .04, .012, .16, .012, PAL.wood);
  if (role === 'farmer') add('cone', 'head', 0, .35, 0, .26, .06, .26, '#e6c779');
  if (role === 'worker') { add('dome', 'head', 0, .29, 0, .16, .12, .16, '#f2a33a'); add('cylinder', 'head', 0, .292, .01, .19, .01, .19, '#f2a33a'); }
  if (role === 'tourist') { add('rbox', 'static', .085, .06, -.05, .05, .12, .09, PAL.coral); add('cylinder', 'static', .085, .15, -.05, .006, .06, .006, PAL.ink); }
  if (role === 'parent') { add('rbox', 'static', 0, .14, .16, .12, .09, .14, PAL.pink); add('dome', 'static', 0, .18, .12, .12, .08, .12, PAL.cream); [-.05, .05].forEach(x => [.11, .21].forEach(z => add('torus', 'static', x, .03, z, .05, .05, .05, PAL.ink, 0, Math.PI / 2))); add('cylinder', 'static', 0, .2, .08, .01, .12, .01, PAL.ink, .5); }
  if (bike) { [-.1, .1].forEach(z => add('torus', 'static', 0, .06, z, .11, .11, .11, PAL.ink, 0, Math.PI / 2)); add('box', 'static', 0, .1, 0, .015, .015, .2, shirt); add('box', 'static', 0, .14, .09, .07, .012, .012, PAL.ink); }
  return { P, bike };
}
function flowStyle(e) { return e === 'official' ? 0 : e === 'thematic' ? 1 : 2; }
const logEvents = [];
if (STAGE >= 4) {
  const wr = mulberry32(42), roleCycle = Object.keys(DATA.roles);
  DATA.flows.forEach((f, fi) => {
    const pts = routePoints(f.from, f.to), lifted = pts.map(p => p.clone().setY(p.y + .07));
    const path = new THREE.CurvePath(); for (let i = 1; i < lifted.length; i++) path.add(new THREE.LineCurve3(lifted[i - 1], lifted[i]));
    const L = path.getLength(), geo = new THREE.TubeGeometry(path, Math.max(32, lifted.length * 6), .055, 8, false);
    const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { ...flowU, uLen: { value: L }, uStyle: { value: flowStyle(f.evidence) }, uColor: { value: C(PAL.coral) } },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `uniform float uTime,uLen,uStyle,uStatic; uniform vec3 uColor; varying vec2 vUv;
      void main(){ float u=vUv.x*uLen*5.-uTime*1.4; float st=uStyle; if(uStatic>.5 && st<.5) st=1.;
        if(st>.5&&st<1.5&&fract(u)>.6) discard; if(st>1.5&&fract(u)>.3) discard; gl_FragColor=vec4(uColor*1.08,.9);
        #include <colorspace_fragment>
      }` });
    const mesh = new THREE.Mesh(geo, mat); mesh.visible = false; mesh.renderOrder = 5; mesh.userData.pick = 'flow'; mesh.userData.flow = f.id; scene.add(mesh);
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
    flowObjs.push({ d: f, mesh, pts, cum, L: cum[cum.length - 1] });
    const n = 4 + Math.floor(wr() * 11);
    for (let w = 0; w < n; w++) {
      const role = w % 3 === 0 ? roleCycle[Math.floor(wr() * roleCycle.length)] : f.role, rp = rolePartsFor(role, wr);
      const spd = rp.bike ? .62 + wr() * .08 : .32 + wr() * .08;
      const sp = new THREE.Sprite(getBadge(f.carry)); sp.scale.set(.16, .16, 1); sp.renderOrder = 8; scene.add(sp);
      const bel = document.createElement('div'); bel.className = 'bubble'; bel.textContent = tr('正在搬 ', 'Carrying ') + tr(f.carryName, f.carryEn);
      const bub = new CSS2DObject(bel); bub.visible = false; scene.add(bub);
      walkers.push({ flow: f, fo: flowObjs[fi], role, parts: rp.P, bike: rp.bike, speed: spd, s: wr() * cum[cum.length - 1], dir: wr() < .5 ? 1 : -1, wait: 0, phase: wr(), lat: (wr() - .5) * .12, pos: new V3(), yaw: 0, badge: sp, bubble: bub, logs: w < 2 });
    }
  });
  // 島上散步的居民（沿步道環繞圈）
  islands.forEach(s => { const pts = []; for (let k = 0; k <= 12; k++) pts.push(nodes[s.node0 + k % 12].p.clone()); const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
    const fo = { pts, cum, L: cum[cum.length - 1] };
    for (let k = 0; k < 3; k++) { const role = roleCycle[Math.floor(wr() * roleCycle.length)], rp = rolePartsFor(role, wr);
      walkers.push({ flow: null, amb: s.i, loop: true, fo, role, parts: rp.P, bike: rp.bike, speed: (rp.bike ? .5 : .22) + wr() * .08, s: wr() * fo.L, dir: wr() < .5 ? 1 : -1, wait: 0, phase: wr(), lat: (wr() - .5) * .14, pos: new V3(), yaw: 0 }); } });
  // 每種零件一個 InstancedMesh（DynamicDrawUsage）
  const WG = { box: GEO.box, capsule: new THREE.CapsuleGeometry(.045, .03, 4, 10), sphere: GEO.sphere, dome: GEO.dome, cylinder: GEO.cylinder, cone: GEO.cone, torus: new THREE.TorusGeometry(.5, .08, 6, 16), rbox: GEO.rbox };
  const counts = {}; walkers.forEach(w => w.parts.forEach(p => counts[p.kind] = (counts[p.kind] || 0) + 1));
  for (const k in counts) { const im = new THREE.InstancedMesh(WG[k], solidMat, counts[k]); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; WPARTS[k] = { im, owners: [] }; scene.add(im); }
  const fill = {}; walkers.forEach((w, wi) => w.parts.forEach(p => { const W = WPARTS[p.kind], i = fill[p.kind] = (fill[p.kind] || 0); fill[p.kind]++; p.slot = i; W.owners[i] = wi; W.im.setColorAt(i, p.col); }));
  WPARTS.capsule.im.userData.pick = 'walker';
  const shGeo = new THREE.CircleGeometry(.09, 16).rotateX(-Math.PI / 2);
  var shadowIM = new THREE.InstancedMesh(shGeo, new THREE.MeshBasicMaterial({ color: '#2a1d14', transparent: true, opacity: .22, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8 }), walkers.length);
  shadowIM.instanceMatrix.setUsage(THREE.DynamicDrawUsage); shadowIM.frustumCulled = false; scene.add(shadowIM);
  // 日誌篩選
  $('#logFilter').innerHTML = `<option value="">${tr('全部協作線', 'All links')}</option>` + DATA.flows.map(f => `<option value="${f.id}">${esc(islandName(f.from))}→${esc(islandName(f.to))}</option>`).join('');
  $('#logFilter').onchange = renderLog;
}
function hhmm(m) { m = Math.floor(((m % 1440) + 1440) % 1440); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
function pushLog(type, w, at) {
  const rn = tr(...DATA.roles[w.role]), cn = tr(w.flow.carryName, w.flow.carryEn), place = islandName(at);
  const txt = type === 'depart' ? tr(`${rn}帶著${cn}從${place}出發`, `${rn} departs ${place} with ${cn}`) : type === 'arrive' ? tr(`${rn}抵達${place}`, `${rn} arrives at ${place}`) : tr(`${rn}在${place}交接${cn}`, `${rn} hands off ${cn} at ${place}`);
  logEvents.unshift({ t: hhmm(state.clock), type, flow: w.flow.id, txt }); if (logEvents.length > 60) logEvents.pop(); logDirty = true;
}
let logDirty = true;
function renderLog() { const f = $('#logFilter').value; $('#logList').innerHTML = logEvents.filter(e => !f || e.flow === f).slice(0, 30).map(e => `<div><span class="t">${e.t} ${e.type.toUpperCase()}</span>${esc(e.txt)}</div>`).join('') || `<div style="color:#8a7a6e">${tr('等待小人出發…', 'Waiting for residents…')}</div>`; logDirty = false; }
const _w = new THREE.Matrix4(), _l = new THREE.Matrix4(), _rot = new THREE.Matrix4(), _tmp = new THREE.Matrix4();
function sampleFlow(fo, s, out) {
  const { pts, cum } = fo; let i = 1; while (i < cum.length - 1 && cum[i] < s) i++;
  const f = (s - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]); out.copy(pts[i - 1]).lerp(pts[i], Math.min(1, Math.max(0, f)));
  return Math.atan2(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
}
function updateWalkers(dt, time, camD) {
  if (!walkers.length) return;
  const zs = Math.min(1.45, Math.max(1, camD / 20));
  walkers.forEach((w, wi) => {
    if (dt > 0 && w.loop) w.s = (w.s + w.dir * w.speed * dt + w.fo.L) % w.fo.L;
    else if (dt > 0) {
      if (w.wait > 0) { w.wait -= dt; if (w.wait <= 0 && w.logs) pushLog('depart', w, w.dir > 0 ? w.flow.from : w.flow.to); }
      else { w.s += w.dir * w.speed * dt;
        if (w.s >= w.fo.L || w.s <= 0) { w.s = Math.min(w.fo.L, Math.max(0, w.s)); const at = w.s > 0 ? w.flow.to : w.flow.from; w.dir *= -1; w.wait = 1.4; if (w.logs) { pushLog('arrive', w, at); pushLog('handoff', w, at); } } }
    }
    let yaw = sampleFlow(w.fo, w.s, w.pos); if (w.dir < 0) yaw += Math.PI; w.yaw = yaw;
    w.pos.x += Math.cos(yaw) * w.lat; w.pos.z -= Math.sin(yaw) * w.lat;
    const moving = w.wait <= 0, ph = time * 9 + w.phase * 20, sw = moving ? Math.sin(ph) : 0, bob = moving ? Math.abs(Math.sin(ph)) * .012 : 0;
    _w.compose(_p.set(w.pos.x, w.pos.y + bob + (w.bike ? .04 : 0), w.pos.z), _q.setFromAxisAngle(new V3(0, 1, 0), yaw), _s.set(zs, zs, zs));
    w.parts.forEach(p => {
      if (p.anim === 'legL' || p.anim === 'legR') { const a = (p.anim === 'legL' ? 1 : -1) * (w.bike ? .5 * Math.sin(ph * 1.3) : .55 * sw); _l.makeTranslation(p.anim === 'legL' ? -.025 : .025, .1, 0).multiply(_rot.makeRotationX(a)).multiply(p.m); }
      else if (p.anim === 'armL' || p.anim === 'armR') { const sgn = p.anim === 'armL' ? -1 : 1, a = (p.anim === 'armL' ? -1 : 1) * .45 * sw - (w.bike ? .9 : 0); _l.makeTranslation(sgn * .062, .2, 0).multiply(_rot.makeRotationX(a)).multiply(p.m); }
      else _l.copy(p.m);
      _tmp.multiplyMatrices(_w, _l); WPARTS[p.kind].im.setMatrixAt(p.slot, _tmp);
    });
    _m.compose(_p.set(w.pos.x, w.pos.y - .012, w.pos.z), _q.identity(), _s.set(zs, 1, zs)); shadowIM.setMatrixAt(wi, _m);
    const dc = camera.position.distanceTo(w.pos);
    if (!w.badge) return;
    w.badge.visible = state.carry && dc < 16; w.badge.position.set(w.pos.x, w.pos.y + .5 * zs, w.pos.z);
    w.bubble.visible = state.names && dc < 14; w.bubble.position.set(w.pos.x, w.pos.y + .66 * zs, w.pos.z);
  });
  for (const k in WPARTS) { WPARTS[k].im.instanceMatrix.needsUpdate = true; WPARTS[k].im.computeBoundingSphere(); }
  shadowIM.instanceMatrix.needsUpdate = true;
}
