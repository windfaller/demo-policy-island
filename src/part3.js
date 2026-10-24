/* ================= 工具 ================= */
const $ = s => document.querySelector(s);
const LANG = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'zh';
const tr = (zh, en) => (LANG === 'en' && en != null) ? en : zh;
function applyLang() {
  if (STAGE < 5 || LANG !== 'en') return;
  document.documentElement.lang = 'en';
  document.querySelectorAll('[data-en]').forEach(el => { el.textContent = el.dataset.en; });
  document.querySelectorAll('[data-en-ph]').forEach(el => { el.placeholder = el.dataset.enPh; });
  document.title = 'Demo City · Policy Islands';
}
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { } } };
function showError(e) {
  const L = $('#loading'); L.classList.add('err'); L.classList.remove('done');
  $('#loadMsg').textContent = tr('載入失敗：', 'Failed to load: ') + (e && e.message ? e.message : e) + '\n' + tr('請確認瀏覽器支援 WebGL 並能連上 cdn.jsdelivr.net。', 'Please check WebGL support and access to cdn.jsdelivr.net.');
  console.warn(e);
}
document.querySelectorAll('[data-stage]').forEach(el => { if (+el.dataset.stage > STAGE) el.classList.add('stage-hide'); });
if (STAGE < 3) ['#tools', '#side', '#hud'].forEach(s => $(s).classList.add('stage-hide'));
applyLang();

try { await main(); } catch (e) { showError(e); }

async function main() {
const THREE = await import('three');
const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
const { CSS2DRenderer, CSS2DObject } = await import('three/addons/renderers/CSS2DRenderer.js');
const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
const BGU = await import('three/addons/utils/BufferGeometryUtils.js');
const { SimplexNoise } = await import('three/addons/math/SimplexNoise.js');
const V3 = THREE.Vector3, C = (h) => new THREE.Color(h);

/* ---------- 常數 ---------- */
const R = 2.02, SPACING = 2.28, TOP = 0.65, WATER_Y = -0.18, SQ3 = Math.sqrt(3);
const PAL = { coral:'#db6a41', ink:'#211d1d', cream:'#fff8f4', yellow:'#fcea8b', stone:'#c5b5a7', green:'#71806a', glass:'#86a8a6', wood:'#b48560', teal:'#3e7c8c', p1:'#9cc27a', p2:'#8db86f', p3:'#728f5f', pink:'#f2b5c6', aqua:'#58a6a6', indigo:'#6f7fb5', wall:'#f4ebdd', eave:'#a34e34', win:'#a8c4c2' };
const isMobile = matchMedia('(max-width:800px)').matches;
const rmq = matchMedia('(prefers-reduced-motion: reduce)');
let RM = STAGE >= 5 && rmq.matches;
const rng = mulberry32(20261024);
const noise = new SimplexNoise({ random: mulberry32(7) });
const CIRC = '①②③④⑤⑥⑦⑧⑨⑩';

/* ---------- renderer / scene ---------- */
const app = $('#app');
let renderer;
try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { throw new Error(tr('無法建立 WebGL：', 'WebGL unavailable: ') + e.message); }
if (!renderer.getContext()) throw new Error('WebGL context lost');
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.4 : 1.75));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
app.prepend(renderer.domElement);
const labelR = new CSS2DRenderer({ element: $('#labels') });
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xf4eee3, 42, 150);
const camera = new THREE.PerspectiveCamera(32, innerWidth / innerHeight, 0.3, 320);
const controls = new OrbitControls(camera, renderer.domElement);
Object.assign(controls, { enableDamping: true, dampingFactor: 0.07, enablePan: false, minPolarAngle: 25 * Math.PI / 180, maxPolarAngle: 70 * Math.PI / 180, minDistance: 3, maxDistance: 70 });

/* ---------- 島嶼座標 ---------- */
const axial = (q, r) => new V3(SQ3 * SPACING * (q + r / 2), 0, 1.5 * SPACING * r);
const islands = DATA.islands.map((d, i) => ({ d, i, c: axial(d.q, d.r), items: [] }));
const center = new V3(); islands.forEach(s => center.add(s.c)); center.divideScalar(islands.length); center.y = TOP;
const byId = {}; islands.forEach(s => byId[s.d.id] = s);

/* ---------- 天空 ---------- */
const skyU = { uTop: { value: C('#9fd0ec') }, uHorizon: { value: C('#f4eee3') }, uSunDir: { value: new V3(0, 1, 0) }, uSun: { value: C('#fff1de') }, uNight: { value: 0 } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(170, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false, uniforms: skyU,
  vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 uTop,uHorizon,uSunDir,uSun; uniform float uNight; varying vec3 vDir;
  void main(){ vec3 d=normalize(vDir); vec3 c=mix(uHorizon,uTop,smoothstep(-.02,.55,d.y));
    float s=max(dot(d,normalize(uSunDir)),0.); c+=uSun*pow(s,18.)*.35;
    vec3 p=floor(d*180.); float n=fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);
    if(n>.9965 && d.y>0.02) c+=vec3(.95)*uNight;
    gl_FragColor=vec4(c,1.);
    #include <colorspace_fragment>
  }` }));
sky.position.copy(center); sky.renderOrder = -10; scene.add(sky);

/* ---------- 光 ---------- */
const hemi = new THREE.HemisphereLight(0xeef6fa, 0x8f8270, 1.3); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1de, 2.8);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 22, bottom: -22, near: 1, far: 90 });
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.045; sun.shadow.radius = 3;
sun.target.position.copy(center); scene.add(sun, sun.target);
const fill = new THREE.DirectionalLight(0xbfd6ff, 0.35); fill.position.copy(center).add(new V3(-20, 12, -18)); scene.add(fill);

/* ---------- 水 shader（亦用於島側壁） ---------- */
const waterU = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uLight: { value: C('#a4d4da') }, uDeep: { value: C('#6fa9b8') }, uTime: { value: 0 }, uCenter: { value: center.clone() } }]);
const waterMat = new THREE.ShaderMaterial({
  uniforms: waterU, fog: true, toneMapped: false,
  vertexShader: `varying vec3 vW;
  #include <fog_pars_vertex>
  void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; vec4 mvPosition=viewMatrix*w; gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
  }`,
  fragmentShader: `uniform vec3 uLight,uDeep,uCenter; uniform float uTime; varying vec3 vW;
  #include <fog_pars_fragment>
  void main(){ float d=length(vW.xz-uCenter.xz);
    float w1=sin(vW.x*.33+uTime*.35)*sin(vW.z*.29-uTime*.27)*.5+.5;
    float w2=sin((vW.x+vW.z)*.57+uTime*.6)*sin((vW.x-vW.z)*.41-uTime*.45)*.5+.5;
    float k=smoothstep(9.,70.,d)*.85+(w1*.6+w2*.4)*.18;
    vec3 c=mix(uLight,uDeep,clamp(k,0.,1.));
    float sp=pow(max(0.,sin(vW.x*3.1+uTime*1.3)*sin(vW.z*2.7-uTime*1.1)),28.)*.10*(1.-smoothstep(10.,40.,d));
    c+=vec3(sp);
    gl_FragColor=vec4(c,1.);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }` });
const water = new THREE.Mesh(new THREE.CircleGeometry(160, 64).rotateX(-Math.PI / 2), waterMat);
water.position.set(center.x, WATER_Y, center.z); water.receiveShadow = false; scene.add(water);

/* ---------- 地面貼圖 ---------- */
function groundTex(style) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d');
  const r2 = mulberry32(style.length * 99);
  g.fillStyle = '#f3e9da'; g.fillRect(0, 0, 256, 256);
  if (style === 'brick') { g.strokeStyle = '#e2d2bd'; g.lineWidth = 3; for (let y = 0; y < 256; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); for (let x = (y / 32) % 2 ? 0 : 32; x < 256; x += 64) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 32); g.stroke(); } } }
  else if (style === 'speckle') { for (let i = 0; i < 900; i++) { g.fillStyle = r2() < .5 ? '#e5d7c3' : '#fbf4ea'; g.beginPath(); g.arc(r2() * 256, r2() * 256, 1 + r2() * 3, 0, 7); g.fill(); } }
  else { g.fillStyle = '#ebdfcc'; for (let x = 0; x < 256; x += 32) g.fillRect(x, 0, 14, 256); }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function bandTex() {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 32; const g = cv.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 32); g.fillStyle = '#e8d9c8';
  for (let x = 0; x < 256; x += 32) { g.beginPath(); g.moveTo(x, 32); g.lineTo(x + 16, 6); g.lineTo(x + 32, 32); g.fill(); }
  g.fillStyle = '#fff8f4'; for (let x = 16; x < 256; x += 32) { g.beginPath(); g.arc(x, 24, 3, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(cv); t.wrapS = THREE.RepeatWrapping; t.repeat.set(6, 1); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function tint(geo, col) { const n = geo.attributes.position.count, a = new Float32Array(n * 3); const c = C(col); for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); return geo; }
const hexFlat = (g) => g.rotateZ(Math.PI / 6).rotateX(-Math.PI / 2);

/* ---------- 島體（合併） ---------- */
const G = { top: { brick: [], speckle: [], stripe: [] }, band: [], side: [], path: [], curb: [], foam: [], shallow: [] };
islands.forEach(s => {
  const { c } = s; const col = C(s.d.color).lerp(C('#fff8f0'), .78);
  const top = hexFlat(new THREE.CircleGeometry(R - 0.05, 6)).translate(c.x, TOP, c.z);
  const uv = top.attributes.uv, p = top.attributes.position; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 2.2, p.getZ(i) / 2.2);
  G.top[s.d.ground].push(tint(top, '#' + col.getHexString()));
  G.band.push(tint(new THREE.CylinderGeometry(R + .005, R + .005, .16, 6, 1, true).translate(c.x, TOP - .08, c.z), s.d.color));
  G.side.push(new THREE.CylinderGeometry(R, R + .06, TOP - .16 - WATER_Y + .4, 6, 1, true).translate(c.x, (TOP - .16 + WATER_Y - .4) / 2, c.z));
  G.path.push(hexFlat(new THREE.RingGeometry(1.8 - .14, 1.8 + .14, 6)).translate(c.x, TOP + .006, c.z));
  G.curb.push(hexFlat(new THREE.RingGeometry(R - .17, R - .05, 6)).translate(c.x, TOP + .012, c.z));
  G.foam.push(hexFlat(new THREE.RingGeometry(R, R + .16, 6)).translate(c.x, WATER_Y + .012, c.z));
  G.shallow.push(hexFlat(new THREE.RingGeometry(R + .1, R + .7, 6)).translate(c.x, WATER_Y + .006, c.z));
});
const islandTops = [];
for (const st in G.top) { if (!G.top[st].length) continue; const m = new THREE.Mesh(BGU.mergeGeometries(G.top[st]), new THREE.MeshStandardMaterial({ map: groundTex(st), vertexColors: true, roughness: .92 })); m.receiveShadow = true; m.userData.pick = 'islandTop'; scene.add(m); islandTops.push(m); }
const band = new THREE.Mesh(BGU.mergeGeometries(G.band), new THREE.MeshStandardMaterial({ map: bandTex(), vertexColors: true, roughness: .85 })); band.receiveShadow = true; scene.add(band);
const side = new THREE.Mesh(BGU.mergeGeometries(G.side), waterMat); scene.add(side);
const pathM = new THREE.Mesh(BGU.mergeGeometries(G.path), new THREE.MeshStandardMaterial({ color: '#efc9ad', roughness: .9, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 })); pathM.receiveShadow = true; scene.add(pathM);
const curb = new THREE.Mesh(BGU.mergeGeometries(G.curb), new THREE.MeshStandardMaterial({ color: '#e4d6c3', roughness: .9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 })); curb.receiveShadow = true; scene.add(curb);
const foam = new THREE.Mesh(BGU.mergeGeometries(G.foam), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 })); scene.add(foam);
const shallow = new THREE.Mesh(BGU.mergeGeometries(G.shallow), new THREE.MeshBasicMaterial({ color: '#d8f1ee', transparent: true, opacity: .28, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 })); scene.add(shallow);

/* ---------- 路網 ---------- */
const nodes = [], adj = [];
const addEdge = (a, b, w) => { adj[a].push([b, w]); adj[b].push([a, w]); };
islands.forEach(s => {
  s.node0 = nodes.length;
  for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6, r = k % 2 ? 1.8 : 1.8 * SQ3 / 2; nodes.push({ p: new V3(s.c.x + Math.cos(a) * r, TOP + .02, s.c.z + Math.sin(a) * r), s: s.i }); adj.push([]); }
  for (let k = 0; k < 12; k++) addEdge(s.node0 + k, s.node0 + (k + 1) % 12, nodes[s.node0 + k].p.distanceTo(nodes[s.node0 + (k + 1) % 12].p));
});
const bridges = {};
islands.forEach(a => islands.forEach(b => {
  if (a.i >= b.i) return; const dx = b.c.x - a.c.x, dz = b.c.z - a.c.z;
  if (Math.hypot(dx, dz) > SQ3 * SPACING * 1.05) return;
  const j = ((Math.round(Math.atan2(dz, dx) / (Math.PI / 3)) % 6) + 6) % 6, jb = (j + 3) % 6;
  const na = a.node0 + 2 * j, nb = b.node0 + 2 * jb, arch = .04 + rng() * .06;
  const pts = []; for (let t = 0; t <= 8; t++) { const f = t / 8; const p = nodes[na].p.clone().lerp(nodes[nb].p, f); p.y = TOP + .03 + Math.sin(Math.PI * f) * arch; pts.push(p); }
  bridges[na + '-' + nb] = pts; bridges[nb + '-' + na] = pts.slice().reverse();
  addEdge(na, nb, nodes[na].p.distanceTo(nodes[nb].p));
}));
function dijkstra(src, dst) {
  const n = nodes.length, dist = new Array(n).fill(Infinity), prev = new Array(n).fill(-1), done = new Array(n).fill(false); dist[src] = 0;
  for (; ;) { let u = -1, best = Infinity; for (let i = 0; i < n; i++) if (!done[i] && dist[i] < best) { best = dist[i]; u = i; } if (u < 0 || u === dst) break; done[u] = true; for (const [v, w] of adj[u]) if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; } }
  const path = []; for (let u = dst; u >= 0; u = prev[u]) path.unshift(u); return path;
}
function routePoints(a, b) {
  const sa = byId[a], sb = byId[b]; let na = sa.node0, nb = sb.node0, best = 1e9;
  for (let k = 0; k < 12; k++) { const d = nodes[sa.node0 + k].p.distanceTo(sb.c); if (d < best) { best = d; na = sa.node0 + k; } }
  best = 1e9; for (let k = 0; k < 12; k++) { const d = nodes[sb.node0 + k].p.distanceTo(sa.c); if (d < best) { best = d; nb = sb.node0 + k; } }
  const ids = dijkstra(na, nb), pts = [nodes[ids[0]].p.clone()];
  for (let i = 1; i < ids.length; i++) { const br = bridges[ids[i - 1] + '-' + ids[i]]; if (br) br.slice(1).forEach(p => pts.push(p.clone())); else pts.push(nodes[ids[i]].p.clone()); }
  return pts;
}

/* ---------- 零件庫 Kit ---------- */
const prismGeo = new THREE.CylinderGeometry(.5, .5, 1, 3).rotateX(-Math.PI / 2).translate(0, -.125, 0).scale(1 / .866, 1 / .75, 1);
const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1), rbox: new RoundedBoxGeometry(1, 1, 1, 2, .12), cylinder: new THREE.CylinderGeometry(.5, .5, 1, 14),
  cone: new THREE.ConeGeometry(.5, 1, 14), sphere: new THREE.SphereGeometry(.5, 16, 12), ico: new THREE.IcosahedronGeometry(.5, 1),
  dome: new THREE.SphereGeometry(.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), torus: new THREE.TorusGeometry(.5, .12, 8, 20), prism: prismGeo,
  hip: new THREE.ConeGeometry(.7071, 1, 4).rotateY(Math.PI / 4), glowbox: new THREE.BoxGeometry(1, 1, 1), glowsphere: new THREE.SphereGeometry(.5, 10, 8)
};
const solidMat = new THREE.MeshStandardMaterial({ roughness: .78, metalness: 0 });
const glowMat = new THREE.MeshStandardMaterial({ roughness: .6, metalness: 0, emissive: new THREE.Color('#ffc777'), emissiveIntensity: 0 });
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new V3(), _p = new V3();
function makeKit() { return { parts: [], meshes: {}, index: {} }; }
const kit = makeKit(), smallKit = makeKit();
/* builder：在單位空間建模，ctx 負責乘上細項矩陣 */
function builder(targetKit, base, owner, jr) {
  const b = { maxY: 0, list: [] };
  b.add = (kind, x, y, z, sx, sy, sz, col, ry = 0, rx = 0, rz = 0) => {
    const j = 1 + (jr() * 2 - 1) * .0072;
    _e.set(rx, ry, rz); _q.setFromEuler(_e); _m.compose(_p.set(x, y, z), _q, _s.set(sx * j, sy * j, sz * j));
    const m = base.clone().multiply(_m);
    const rec = { kind, matrix: m, color: C(col), owner }; targetKit.parts.push(rec); b.list.push(rec);
    b.maxY = Math.max(b.maxY, y + sy / 2); return rec;
  };
  b.bx = (x, y0, z, sx, sy, sz, c, ry = 0) => b.add('box', x, y0 + sy / 2, z, sx, sy, sz, c, ry);
  b.rb = (x, y0, z, sx, sy, sz, c, ry = 0) => b.add('rbox', x, y0 + sy / 2, z, sx, sy, sz, c, ry);
  b.cy = (x, y0, z, r, h, c) => b.add('cylinder', x, y0 + h / 2, z, r * 2, h, r * 2, c);
  b.co = (x, y0, z, r, h, c) => b.add('cone', x, y0 + h / 2, z, r * 2, h, r * 2, c);
  b.sp = (x, y, z, r, c) => b.add('sphere', x, y, z, r * 2, r * 2, r * 2, c);
  b.ic = (x, y, z, r, c, sy = 1) => b.add('ico', x, y, z, r * 2, r * 2 * sy, r * 2, c, jr() * 6);
  b.dm = (x, y0, z, r, c, sy = 1) => b.add('dome', x, y0, z, r * 2, r * 2 * sy, r * 2, c);
  b.hp = (x, y0, z, sx, h, sz, c) => b.add('hip', x, y0 + h / 2, z, sx, h, sz, c);
  b.pr = (x, y0, z, sx, h, sz, c) => b.add('prism', x, y0 + h / 2, z, sx, h, sz, c);
  b.gb = (x, y0, z, sx, sy, sz, c = PAL.win) => b.add('glowbox', x, y0 + sy / 2, z, sx, sy, sz, c);
  b.gs = (x, y, z, r, c = '#ffe9b8') => b.add('glowsphere', x, y, z, r * 2, r * 2, r * 2, c);
  b.disc = (x, y, z, r, t, c, ry = 0) => b.add('cylinder', x, y, z, r * 2, t, r * 2, c, ry, Math.PI / 2);
  b.tor = (x, y, z, r, c, ry = 0, rx = 0) => b.add('torus', x, y, z, r * 2, r * 2, r * 2, c, ry, rx);
  return b;
}
function personMini(b, x, z, c) { b.cy(x, 0, z, .045, .12, c); b.sp(x, .17, z, .045, '#f3d2b8'); }
const ARCH = {
  house(b, acc) {
    b.rb(0, 0, 0, .8, .55, .7, PAL.wall); b.bx(0, .55, 0, .9, .05, .8, PAL.eave); b.hp(0, .6, 0, .86, .42, .76, PAL.coral);
    b.gb(-.22, .2, .355, .16, .16, .02); b.gb(.22, .2, .355, .16, .16, .02); b.gb(.405, .22, 0, .02, .16, .2);
    b.bx(0, 0, .355, .14, .28, .02, PAL.wood); b.bx(.22, .7, -.1, .1, .28, .1, PAL.stone); b.ic(-.42, .12, .38, .1, PAL.p2);
  },
  hall(b, acc) {
    b.bx(0, 0, 0, 1, .08, .8, PAL.stone); b.rb(0, .08, -.05, .92, .5, .6, PAL.cream);
    for (let i = -2; i <= 2; i++) b.cy(i * .2, .08, .3, .035, .45, '#ffffff');
    b.pr(0, .58, .02, .98, .22, .68, PAL.coral); b.gb(-.3, .25, .255, .14, .18, .02); b.gb(.3, .25, .255, .14, .18, .02);
    b.rb(0, .58, -.25, .26, .7, .26, PAL.wall); b.disc(0, 1.08, -.11, .09, .02, '#ffffff'); b.bx(0, 1.06, -.1, .01, .07, .01, PAL.ink); b.bx(.02, 1.08, -.1, .05, .01, .01, PAL.ink);
    b.hp(0, 1.28, -.25, .32, .22, .32, PAL.coral); b.gs(0, 1.18, -.25, .05);
  },
  kiosk(b, acc) {
    b.bx(0, 0, 0, .9, .05, .8, PAL.stone);
    [[-.35, -.3], [.35, -.3], [-.35, .3], [.35, .3]].forEach(([x, z]) => b.cy(x, .05, z, .025, .55, PAL.wood));
    b.hp(0, .6, 0, .95, .3, .85, acc); for (let i = 0; i < 5; i++) b.bx(-.36 + i * .18, .52, .4, .14, .08, .04, i % 2 ? '#ffffff' : acc);
    b.rb(0, .05, .15, .7, .28, .25, PAL.wood); b.sp(-.2, .38, .15, .05, PAL.coral); b.sp(0, .38, .15, .05, PAL.yellow); b.sp(.2, .38, .15, .05, PAL.p1); b.gs(0, .55, 0, .04);
  },
  classroom(b) {
    b.bx(0, 0, 0, 1, .06, .9, '#f1e1c8'); b.bx(0, .06, -.42, 1, .55, .06, PAL.wall); b.bx(0, .22, -.385, .6, .28, .02, '#3e5a4b');
    b.bx(-.48, .06, 0, .04, .3, .9, PAL.wall); b.bx(.48, .06, 0, .04, .3, .9, PAL.wall); b.gb(-.48, .4, .1, .05, .15, .4);
    [[-.22, -.05], [.22, -.05], [-.22, .25], [.22, .25]].forEach(([x, z]) => { b.bx(x, .06, z, .26, .16, .14, PAL.wood); b.bx(x, .06, z + .15, .12, .08, .1, PAL.coral); });
    personMini(b, -.22, .4, PAL.indigo); personMini(b, .22, .4, PAL.aqua); personMini(b, 0, -.25, PAL.coral);
  },
  clinic(b) {
    b.rb(0, 0, 0, .9, .6, .7, '#ffffff'); b.bx(0, .6, 0, .95, .06, .75, PAL.aqua);
    b.bx(0, .32, .355, .26, .08, .02, PAL.coral); b.bx(0, .24, .355, .08, .24, .02, PAL.coral);
    b.gb(-.3, .3, .355, .16, .14, .02); b.gb(.3, .3, .355, .16, .14, .02); b.bx(0, 0, .355, .2, .2, .02, PAL.glass);
    b.rb(.15, .66, -.1, .3, .18, .3, PAL.cream); b.cy(-.3, .66, .15, .04, .2, PAL.stone);
  },
  busstop(b, acc) {
    b.bx(0, 0, 0, 1, .04, .9, '#d9cbb8'); b.bx(-.25, .04, -.3, .5, .02, .25, PAL.stone);
    b.cy(-.45, .04, -.35, .02, .4, PAL.ink); b.cy(-.05, .04, -.35, .02, .4, PAL.ink); b.bx(-.25, .44, -.33, .5, .03, .28, acc); b.bx(-.25, .1, -.45, .45, .3, .02, PAL.glass);
    b.bx(-.25, .04, -.35, .35, .08, .08, PAL.wood);
    b.rb(.1, .07, .22, .82, .32, .3, PAL.yellow); for (let i = 0; i < 4; i++) b.gb(-.18 + i * .18, .23, .37, .13, .1, .01);
    b.gb(.51, .2, .22, .01, .12, .22); b.bx(.1, .19, .22, .84, .03, .31, PAL.coral);
    [-.18, .38].forEach(x => { b.disc(x, .07, .38, .06, .04, PAL.ink); b.disc(x, .07, .06, .06, .04, PAL.ink); });
    b.cy(.4, .04, -.3, .015, .5, PAL.ink); b.disc(.4, .56, -.3, .07, .015, PAL.coral);
  },
  bikerack(b, acc) {
    b.bx(0, 0, 0, 1, .04, .8, '#ddd0be');
    for (let i = 0; i < 3; i++) { const z = -.25 + i * .25, c = [PAL.coral, PAL.aqua, PAL.indigo][i];
      b.tor(-.2, .14, z, .1, PAL.ink, Math.PI / 2); b.tor(.15, .14, z, .1, PAL.ink, Math.PI / 2); b.bx(-.03, .2, z, .32, .03, .03, c); b.bx(-.08, .28, z, .1, .02, .05, PAL.ink); b.cy(.12, .14, z, .012, .16, c); }
    b.bx(.38, .04, 0, .04, .25, .7, PAL.stone); b.rb(.38, .29, 0, .1, .1, .7, acc);
  },
  court(b) {
    b.bx(0, 0, 0, 1, .04, .9, '#7fa86a'); b.bx(0, .04, 0, .9, .005, .8, '#8ebc76');
    [[0, .41, .9, .02], [0, -.41, .9, .02], [-.45, 0, .02, .8], [.45, 0, .02, .8], [0, 0, .02, .8]].forEach(([x, z, sx, sz]) => b.bx(x, .045, z, sx, .006, sz, '#ffffff'));
    b.cy(-.44, .04, 0, .02, .45, PAL.ink); b.bx(-.4, .42, 0, .02, .16, .22, '#ffffff'); b.tor(-.36, .42, 0, .05, PAL.coral, 0, Math.PI / 2);
    b.sp(.15, .09, .12, .05, PAL.coral); b.bx(.3, .04, -.38, .3, .08, .06, PAL.wood);
  },
  farm(b, acc) {
    b.bx(0, 0, 0, 1, .06, .9, '#a07b58');
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) b.ic(-.36 + c * .18, .12, -.3 + r * .2, .065, r % 2 ? PAL.p1 : PAL.p2);
    for (let c = 0; c < 5; c++) b.sp(-.36 + c * .18, .2, -.1, .025, [PAL.pink, PAL.yellow, PAL.coral][c % 3]);
    for (let i = 0; i < 6; i++) b.bx(-.45 + i * .18, .06, .45, .03, .14, .03, PAL.wood); b.bx(0, .14, .45, .95, .02, .02, PAL.wood);
    b.cy(.38, .06, .32, .015, .3, PAL.wood); b.bx(.38, .28, .32, .2, .02, .02, PAL.wood); b.co(.38, .36, .32, .07, .08, PAL.yellow);
  },
  river(b, acc) {
    b.bx(0, 0, 0, 1, .04, .9, PAL.p2); b.bx(0, .04, 0, .3, .012, .9, '#6fb6c2');
    b.bx(-.18, .04, 0, .04, .05, .9, PAL.stone); b.bx(.18, .04, 0, .04, .05, .9, PAL.stone);
    for (let i = 0; i < 7; i++) { const f = i / 6; b.bx(-.24 + f * .48, .07 + Math.sin(f * Math.PI) * .09, .05, .07, .03, .2, PAL.wood); }
    b.ic(-.36, .22, -.3, .12, PAL.p1); b.cy(-.36, .04, -.3, .02, .12, PAL.wood); b.ic(.36, .22, .3, .12, PAL.p3); b.cy(.36, .04, .3, .02, .12, PAL.wood);
    b.bx(.35, .04, -.3, .22, .06, .08, PAL.wood);
  },
  stage(b, acc) {
    b.rb(0, 0, -.1, .95, .18, .6, PAL.wood); b.bx(0, .18, -.38, .95, .55, .05, acc);
    b.dm(0, .7, -.2, .5, PAL.coral, .45); for (let i = -2; i <= 2; i++) b.gs(i * .18, .7, .12, .03);
    b.bx(-.4, .18, -.15, .12, .22, .1, PAL.ink); b.bx(.4, .18, -.15, .12, .22, .1, PAL.ink); personMini({ cy: (x, y, z, r, h, c) => b.cy(x, y + .18, z, r, h, c), sp: (x, y, z, r, c) => b.sp(x, y + .18, z, r, c) }, 0, -.05, PAL.yellow);
    for (let i = 0; i < 4; i++) b.bx(-.3 + i * .2, 0, .35, .14, .07, .08, PAL.stone);
  },
  book(b) {
    b.bx(0, 0, 0, .9, .05, .7, PAL.stone);
    b.rb(-.2, .05, 0, .38, .07, .6, PAL.coral, -.12); b.bx(-.2, .12, 0, .36, .03, .56, PAL.cream, -.12);
    b.add('box', .05, .55, 0, .08, .8, .58, PAL.teal, 0, 0, -.12); b.add('box', .12, .55, 0, .06, .76, .54, PAL.cream, 0, 0, -.12); b.add('box', .2, .55, 0, .08, .8, .58, PAL.indigo, 0, 0, -.2);
    b.bx(.36, .05, .1, .15, .45, .45, PAL.yellow);
  },
  coin(b) {
    b.bx(0, 0, 0, .9, .05, .7, PAL.stone); b.disc(0, .5, 0, .4, .1, '#f2c14e'); b.tor(0, .5, .055, .3, '#e3a92c'); b.bx(0, .5, .06, .06, .3, .02, '#e3a92c');
    for (let i = 0; i < 4; i++) b.cy(.33, .05 + i * .06, .2, .12, .05, '#f2c14e');
  },
  clock(b) {
    b.bx(0, 0, 0, .8, .05, .6, PAL.stone); b.cy(0, .05, 0, .04, .4, PAL.ink); b.disc(0, .8, 0, .38, .1, PAL.cream);
    b.add('torus', 0, .8, .0, .78, .78, .9, PAL.coral); b.add('box', 0, .9, .06, .03, .22, .02, PAL.ink); b.add('box', .08, .8, .06, .18, .03, .02, PAL.ink, 0, 0, .3); b.sp(0, .8, .07, .03, PAL.coral);
  },
  globe(b) {
    b.cy(0, 0, 0, .3, .08, PAL.wood); b.cy(0, .08, 0, .04, .25, PAL.ink); b.sp(0, .72, 0, .38, PAL.aqua);
    b.ic(.12, .86, .25, .14, PAL.p1, .5); b.ic(-.22, .62, .24, .12, PAL.p1, .5); b.ic(.2, .55, -.25, .15, PAL.p2, .5);
    b.add('torus', 0, .72, 0, .9, .9, .9, PAL.coral, 0, 0, .4);
  }
};
/* ---------- 細節加料（每種 archetype 的附加零件） ---------- */
const EXTRA = {
  house(b, acc) { [-.22, .22].forEach((x, i) => { b.bx(x, .08, .375, .2, .04, .06, PAL.wood); b.ic(x - .05, .14, .38, .04, i ? PAL.p1 : PAL.pink); b.ic(x + .05, .14, .38, .04, PAL.yellow); });
    b.bx(-.47, .3, -.05, .1, .03, .3, PAL.wood); for (let i = 0; i < 4; i++) b.bx(-.51, .33, -.17 + i * .08, .01, .07, .01, '#ffffff'); b.dm(.25, .84, .12, .05, '#ffffff');
    for (let i = 0; i < 6; i++) b.bx(-.47 + i * .09, 0, .47, .025, .11, .025, '#ffffff'); b.bx(-.25, .08, .47, .47, .02, .02, '#ffffff');
    b.cy(.42, 0, .45, .02, .15, PAL.ink); b.rb(.42, .15, .45, .08, .07, .1, PAL.coral); b.bx(0, .29, .36, .22, .03, .08, PAL.coral); },
  hall(b, acc) { b.cy(.44, .08, .34, .012, .95, '#ffffff'); b.bx(.5, .88, .34, .11, .07, .01, acc); b.sp(.44, 1.04, .34, .018, PAL.yellow);
    for (let i = 0; i < 3; i++) b.bx(0, 0, .44 + i * .04, .5 - i * .06, .08 - i * .025, .05, PAL.stone);
    [-.42, .42].forEach(x => { b.cy(x, .08, .44, .055, .08, PAL.coral); b.ic(x, .21, .44, .07, PAL.p2); }); b.bx(0, .43, .31, .32, .08, .015, acc); b.gs(-.2, .6, .33, .025); b.gs(.2, .6, .33, .025);
    b.bx(-.3, .6, -.1, .2, .06, .2, PAL.p1); b.ic(-.3, .7, -.1, .06, PAL.p2); },
  kiosk(b, acc) { [[-.32, .42], [.32, .42]].forEach(([x, z]) => { b.cy(x, .05, z, .01, .3, PAL.ink); b.co(x, .32, z, .14, .07, '#ffffff'); b.cy(x, .05, z, .05, .1, PAL.wood); b.bx(x + .07, .05, z, .04, .06, .04, PAL.wood); });
    b.bx(0, .9, 0, .42, .13, .03, PAL.cream); b.bx(0, .93, .017, .3, .06, .01, acc); b.bx(.4, .05, -.32, .12, .1, .12, PAL.wood); b.bx(.4, .15, -.32, .1, .08, .1, '#d6a77f'); b.gs(-.3, .58, .4, .02); b.gs(.3, .58, .4, .02); },
  classroom(b) { b.bx(.38, .06, -.3, .14, .36, .1, PAL.wood); for (let i = 0; i < 3; i++) b.bx(.38, .12 + i * .1, -.24, .12, .06, .02, [PAL.coral, PAL.teal, PAL.yellow][i]);
    b.disc(-.3, .45, -.385, .05, .02, '#ffffff'); b.cy(-.38, .06, .38, .04, .08, PAL.coral); b.ic(-.38, .18, .38, .06, PAL.p2); b.sp(.38, .5, -.3, .04, PAL.aqua);
    b.bx(0, .61, -.42, 1.04, .04, .1, PAL.coral); b.bx(-.25, .61, -.25, .5, .02, .3, '#ffffff'); },
  clinic(b) { for (let i = 0; i < 4; i++) b.ic(-.32 + i * .1, .72, .2, .05, i % 2 ? PAL.p1 : PAL.p2); b.bx(-.2, .66, .2, .45, .04, .14, PAL.wood);
    b.rb(.2, 0, .55, .36, .18, .18, '#ffffff'); b.bx(.2, .1, .645, .36, .03, .005, PAL.coral); b.gb(.32, .1, .55, .1, .07, .17); [.08, .32].forEach(x => b.disc(x, .03, .64, .035, .03, PAL.ink));
    b.cy(.38, .66, -.25, .015, .2, PAL.ink); b.dm(.38, .86, -.25, .06, PAL.coral, .5); b.bx(-.36, 0, .45, .16, .03, .06, PAL.wood); },
  busstop(b, acc) { b.cy(.45, .04, .45, .012, .3, PAL.ink); b.disc(.45, .36, .45, .05, .01, PAL.aqua); b.cy(-.45, .04, -.1, .03, .08, PAL.green);
    b.ic(.42, .2, -.42, .1, PAL.p2); b.cy(.42, .04, -.42, .015, .1, PAL.wood); b.bx(-.25, .46, -.33, .4, .05, .02, PAL.ink); b.gb(-.25, .465, -.32, .3, .03, .01, '#ffd98a'); },
  bikerack(b, acc) { b.cy(-.42, .04, -.38, .015, .45, PAL.ink); b.cy(.32, .04, -.38, .015, .45, PAL.ink); b.bx(-.05, .49, -.15, .9, .03, .6, acc);
    b.bx(-.42, .04, .38, .02, .3, .2, PAL.ink); b.bx(-.41, .1, .38, .01, .2, .18, PAL.yellow);
    b.tor(.15, .07, .42, .06, PAL.ink, Math.PI / 2); b.tor(.38, .07, .42, .06, PAL.ink, Math.PI / 2); b.rb(.26, .1, .42, .2, .07, .06, PAL.coral); b.cy(.36, .1, .42, .01, .14, PAL.ink); },
  court(b) { for (let i = 0; i < 3; i++) b.bx(0, .04 + i * .05, .45 + i * .03, .8, .05, .04, [PAL.teal, PAL.aqua, PAL.indigo][i]);
    for (let i = 0; i < 6; i++) b.cy(-.48 + i * .19, .04, -.44, .008, .3, PAL.ink); b.bx(0, .3, -.44, .96, .01, .01, PAL.ink);
    b.cy(.44, .04, 0, .02, .45, PAL.ink); b.bx(.4, .42, 0, .02, .16, .22, '#ffffff'); b.tor(.36, .42, 0, .05, PAL.coral, 0, Math.PI / 2); personMini(b, -.1, -.1, PAL.coral); personMini(b, .2, .15, PAL.indigo); },
  farm(b, acc) { b.bx(-.3, .06, .25, .3, .16, .22, '#cfe3dd'); b.pr(-.3, .22, .25, .32, .12, .24, '#e8f2ee'); b.ic(-.3, .12, .25, .06, PAL.p1);
    b.cy(.15, .06, .33, .03, .05, PAL.teal); b.bx(.2, .09, .33, .05, .01, .01, PAL.teal); b.rb(.3, .06, .1, .1, .06, .08, PAL.wood); b.sp(.3, .14, .1, .03, '#e8603c'); b.sp(.25, .14, .1, .025, PAL.yellow); },
  river(b, acc) { for (let i = 0; i < 6; i++) b.cy(-.13 + (i % 2) * .02, .04, -.42 + i * .04, .006, .12 + (i % 3) * .03, PAL.p3); b.disc(.05, .055, -.25, .04, .005, PAL.p1, 0); b.add('cylinder', .06, .055, .3, .07, .005, .07, PAL.p1);
    b.rb(.02, .05, -.1, .1, .03, .2, '#ffffff'); b.bx(.33, .1, -.3, .2, .02, .02, PAL.wood); b.cy(.45, .04, 0, .012, .2, PAL.ink); b.gs(.45, .26, 0, .025); },
  stage(b, acc) { for (let i = 0; i < 5; i++) { b.gs(-.4 + i * .2, .78, .25, .02, [PAL.yellow, PAL.pink, '#ffffff'][i % 3]); } b.bx(-.47, .18, -.36, .02, .6, .02, PAL.ink); b.bx(.47, .18, -.36, .02, .6, .02, PAL.ink);
    b.bx(-.47, .55, -.3, .01, .18, .12, PAL.yellow); b.bx(.47, .55, -.3, .01, .18, .12, PAL.yellow);
    for (let i = 0; i < 5; i++) personMini(b, -.36 + i * .18, .45, [PAL.coral, PAL.aqua, PAL.indigo, PAL.pink, PAL.green][i]); },
  book(b) { b.bx(.05, .95, .1, .03, .25, .01, PAL.yellow); for (let i = 0; i < 3; i++) b.rb(-.32, .05 + i * .05, .25, .22, .045, .16, [PAL.teal, PAL.yellow, PAL.pink][i], i * .2);
    b.cy(.38, .5, -.2, .01, .25, PAL.ink); b.co(.38, .72, -.2, .07, .07, PAL.coral); b.gs(.38, .72, -.2, .025); },
  coin(b) { b.sp(-.3, .17, .15, .12, PAL.pink); b.sp(-.2, .2, .15, .04, PAL.pink); [[-.37, .09], [-.24, .09], [-.37, .21], [-.24, .21]].forEach(([x, z]) => b.cy(x, .05, z, .02, .05, PAL.pink)); b.bx(-.3, .28, .15, .06, .01, .015, PAL.ink);
    for (let i = 0; i < 2; i++) b.cy(.25, .05 + i * .06, -.22, .1, .05, '#f2c14e'); },
  clock(b) { b.bx(.3, .05, .2, .3, .03, .1, PAL.wood); b.bx(.3, .08, .15, .3, .1, .02, PAL.wood); b.cy(-.3, .05, .15, .06, .02, PAL.wood); b.co(-.3, .07, .15, .05, .08, '#f6e2b0'); b.co(-.3, .15, .15, .05, .08, '#f6e2b0'); b.cy(-.3, .23, .15, .06, .02, PAL.wood);
    b.gs(0, 1.22, 0, .03); },
  globe(b) { [[-.35, PAL.coral], [.35, PAL.indigo]].forEach(([x, c]) => { b.cy(x, 0, .3, .01, .4, PAL.ink); b.bx(x + .05, .33, .3, .09, .06, .005, c); });
    b.sp(.32, 1.05, -.2, .03, '#ffffff'); b.bx(.32, 1.05, -.2, .12, .005, .04, PAL.teal); b.add('torus', 0, .72, 0, 1.1, 1.1, 1.1, PAL.yellow, 0, Math.PI / 2, 0); }
};
/* 街道家具（真實尺寸，世界單位） */
const FURN = {
  mailbox(b) { b.cy(0, 0, 0, .012, .1, PAL.ink); b.rb(0, .1, 0, .06, .07, .08, PAL.coral); },
  vending(b) { b.rb(0, 0, 0, .1, .18, .08, PAL.teal); b.gb(0, .07, .041, .07, .09, .005, '#ffe9b8'); b.bx(0, .02, .041, .05, .02, .005, PAL.ink); },
  bin(b) { b.cy(-.03, 0, 0, .025, .07, PAL.green); b.cy(.03, 0, 0, .025, .07, PAL.aqua); b.cy(-.03, .07, 0, .028, .008, PAL.ink); b.cy(.03, .07, 0, .028, .008, PAL.ink); },
  hedge(b) { b.rb(0, 0, 0, .28, .08, .07, PAL.p3); b.sp(-.08, .09, 0, .015, PAL.pink); b.sp(.07, .09, 0, .015, '#ffffff'); },
  lantern(b) { b.cy(0, 0, 0, .008, .18, PAL.wood); b.bx(0, .18, 0, .04, .05, .04, PAL.eave); b.gs(0, .2, 0, .02, '#ffd98a'); },
  signpost(b) { b.cy(0, 0, 0, .008, .24, PAL.ink); b.bx(.04, .2, 0, .1, .028, .008, PAL.coral); b.bx(-.03, .16, 0, .09, .028, .008, PAL.teal, .6); },
  scooter(b) { b.tor(0, .025, -.04, .025, PAL.ink, Math.PI / 2); b.tor(0, .025, .05, .025, PAL.ink, Math.PI / 2); b.rb(0, .03, 0, .04, .04, .1, PAL.yellow); b.cy(0, .05, .05, .006, .07, PAL.ink); b.bx(0, .06, -.03, .035, .015, .05, PAL.ink); },
  umbrella(b) { b.cy(0, 0, 0, .006, .2, '#ffffff'); b.co(0, .2, 0, .11, .05, PAL.pink); b.cy(0, 0, 0, .04, .06, '#ffffff'); b.bx(-.065, 0, 0, .03, .04, .03, PAL.wood); b.bx(.065, 0, 0, .03, .04, .03, PAL.wood); },
  flowerbed(b) { b.bx(0, 0, 0, .22, .04, .09, PAL.wood); for (let i = 0; i < 4; i++) b.ic(-.08 + i * .055, .055, 0, .025, [PAL.pink, PAL.yellow, '#ffffff', PAL.coral][i]); },
  bikes(b) { [-.04, .04].forEach(x => { b.tor(x, .03, -.04, .03, PAL.ink, Math.PI / 2); b.tor(x, .03, .04, .03, PAL.ink, Math.PI / 2); b.bx(x, .045, 0, .008, .008, .08, PAL.coral); }); }
};
const FURN_KEYS = Object.keys(FURN);
/* 空格子的地面小景 */
const PATCH = {
  fountain(b) { b.cy(0, 0, 0, .45, .1, PAL.stone); b.cy(0, .02, 0, .4, .09, '#7cc3cc'); b.cy(0, .1, 0, .06, .25, PAL.cream); b.cy(0, .35, 0, .18, .04, PAL.stone); b.sp(0, .42, 0, .07, '#bfe6ea'); },
  garden(b) { b.bx(0, 0, 0, .85, .04, .85, '#a07b58'); for (let i = 0; i < 9; i++) b.ic(-.28 + (i % 3) * .28, .1, -.28 + Math.floor(i / 3) * .28, .09, [PAL.pink, PAL.p1, PAL.yellow][i % 3]); },
  cafe(b) { b.bx(0, 0, 0, .9, .015, .9, '#e9dccb'); [[-.22, -.22], [.22, .22], [.22, -.22]].forEach(([x, z], i) => { b.cy(x, 0, z, .01, .45, '#ffffff'); b.co(x, .42, z, .22, .1, [PAL.coral, PAL.aqua, PAL.yellow][i]); b.cy(x, 0, z, .08, .12, '#ffffff'); }); },
  car(b) { b.rb(0, .06, 0, .4, .16, .8, PAL.aqua); b.rb(0, .2, -.05, .36, .14, .42, '#ffffff'); b.gb(0, .22, .17, .3, .09, .01); [[-.2, -.25], [.2, -.25], [-.2, .25], [.2, .25]].forEach(([x, z]) => b.add('cylinder', x, .07, z, .14, .06, .14, PAL.ink, 0, 0, Math.PI / 2)); }
};
const PATCH_KEYS = Object.keys(PATCH);
const noop = () => { };

const TREES = {
  conifer(b) { b.cy(0, 0, 0, .05, .2, PAL.wood); b.co(0, .15, 0, .3, .45, PAL.p3); b.co(0, .42, 0, .24, .38, PAL.green); b.co(0, .65, 0, .16, .3, PAL.p3); },
  cherry(b) { b.cy(0, 0, 0, .05, .35, PAL.wood); b.ic(0, .5, 0, .26, '#f2b5c6'); b.ic(.15, .42, .1, .17, '#f7cad6'); b.ic(-.15, .45, -.05, .18, '#eea6ba'); },
  fruit(b) { b.cy(0, 0, 0, .05, .3, PAL.wood); b.ic(0, .45, 0, .27, PAL.p2); [[.15, .45, .2], [-.2, .5, .1], [.05, .62, -.2], [-.1, .35, -.2]].forEach(([x, y, z]) => b.sp(x, y, z, .04, '#e8603c')); },
  palm(b) { for (let i = 0; i < 5; i++) b.cy(Math.sin(i * .4) * .03, i * .14, 0, .04 - i * .004, .15, PAL.wood); for (let i = 0; i < 6; i++) b.add('box', Math.cos(i) * .16, .72, Math.sin(i) * .16, .34, .02, .09, PAL.p2, -i, 0, -.35); b.sp(0, .7, 0, .06, '#8a6a3c'); },
  willow(b) { b.cy(0, 0, 0, .05, .35, PAL.wood); b.dm(0, .34, 0, .3, PAL.p1, 1.1); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; b.cy(Math.cos(a) * .27, .1, Math.sin(a) * .27, .03, .3, PAL.p2); } },
  round(b) { b.cy(0, 0, 0, .05, .3, PAL.wood); b.sp(0, .52, 0, .28, PAL.p2); b.sp(.12, .66, .05, .14, PAL.p1); }
};
const itemRec = {}; // id -> {parts, top, pos, island}
function itemMatrix(x, z, sc, ry) { return new THREE.Matrix4().compose(new V3(x, TOP, z), new THREE.Quaternion().setFromAxisAngle(new V3(0, 1, 0), ry), new V3(sc, sc, sc)); }
function finalizeKit(K, opts) {
  const groups = {}; K.parts.forEach(p => (groups[p.kind] = groups[p.kind] || []).push(p));
  for (const kind in groups) {
    const list = groups[kind], mat = kind.startsWith('glow') ? glowMat : solidMat;
    const im = new THREE.InstancedMesh(GEO[kind], mat, list.length);
    list.forEach((p, i) => { im.setMatrixAt(i, p.matrix); im.setColorAt(i, p.color); p.mesh = im; p.idx = i; });
    im.castShadow = opts.cast; im.receiveShadow = true; im.userData.owners = list.map(p => p.owner); im.userData.pick = opts.pick ? 'kit' : null;
    im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); K.meshes[kind] = im; scene.add(im);
  }
}

/* ---------- 橋 ---------- */
{ const jb = mulberry32(11); const done = new Set();
  for (const k in bridges) { const [a, b2] = k.split('-').map(Number); const key = Math.min(a, b2) + '-' + Math.max(a, b2); if (done.has(key)) continue; done.add(key);
    const pts = bridges[k], dir = pts[8].clone().sub(pts[0]), ry = -Math.atan2(dir.z, dir.x), len = dir.length() / 8;
    const bb = builder(kit, new THREE.Matrix4(), { type: 'bridge' }, jb);
    pts.forEach((p, i) => { bb.add('box', p.x, p.y - .02, p.z, len * 1.02, .05, .34, i % 2 ? '#d6a77f' : PAL.wood, ry); });
    [0, 8].forEach(i => { [-1, 1].forEach(sd => { const p = pts[i], off = new V3(-Math.sin(-ry) * 0, 0, 0); bb.add('cylinder', p.x + Math.sin(ry) * .17 * sd, p.y + .1, p.z + Math.cos(ry) * .17 * sd, .04, .22, .04, PAL.wood); }); });
  } }

/* ---------- 島內建物、街道家具 ---------- */
const lamps = [];
if (STAGE >= 2) {
  const jr = mulberry32(99);
  islands.forEach(s => {
    const its = s.d.items, n = its.length - 1, cx = s.c.x, cz = s.c.z;
    let cell = .62, cands = [];
    for (cell = .62; cell >= .46; cell -= .02) {
      cands = []; const dz = cell * .866;
      for (let row = -6; row <= 6; row++) for (let col = -6; col <= 6; col++) {
        const x = (col + (row & 1) * .5) * cell, z = row * dz, hw = cell * .42;
        if (Math.abs(x) + hw > 1.36 || (Math.abs(x) + hw) * .5 + (Math.abs(z) + hw) * .866 > 1.36) continue;
        if (Math.abs(x) < .58 + cell * .45 && Math.abs(z + .58) < .58 + cell * .45) continue;
        cands.push({ x, z, d: Math.hypot(x, z - .2) });
      }
      if (cands.length >= n) break;
    }
    cands.sort((a, b) => a.d - b.d);
    its.forEach((it, k) => {
      let x = 0, z = -.58, sc = 1.15;
      if (k > 0) { const c = cands[k - 1] || { x: (k - 2) * .4, z: .9 }; x = c.x; z = c.z; sc = cell * .88; }
      const wx = cx + x, wz = cz + z, b = builder(kit, itemMatrix(wx, wz, sc, 0), { type: 'item', id: it.id, island: s.i }, jr);
      (ARCH[it.model] || ARCH.house)(b, s.d.color); (EXTRA[it.model] || noop)(b, s.d.color);
      itemRec[it.id] = { parts: b.list, top: TOP + b.maxY * sc, pos: new V3(wx, TOP, wz), island: s, d: it, num: k };
      s.items.push(it.id);
    });
    // 主建物廣場 + 空格小景
    builder(kit, itemMatrix(cx, cz - .58, 1, 0), { type: 'island', island: s.i }, jr).add('cylinder', 0, .004, 0, 1.5, .008, 1.5, '#ece0d0');
    cands.slice(n, n + 2).forEach((c, k) => { const b = builder(kit, itemMatrix(cx + c.x, cz + c.z, cell * .8, jr() * 6), { type: 'island', island: s.i }, jr); PATCH[PATCH_KEYS[(s.i + k * 2) % PATCH_KEYS.length]](b); });
    // 步道內側家具
    for (let j = 0; j < 6; j++) { const a = j * Math.PI / 3, rx = Math.cos(a), rz = Math.sin(a), yaw = Math.atan2(-rx, -rz);
      [-.5, .5].forEach((t, q) => { const x = cx + rx * 1.42 - rz * t, z = cz + rz * 1.42 + rx * t;
        const b = builder(smallKit, itemMatrix(x, z, 1, yaw), { type: 'island', island: s.i }, jr); FURN[FURN_KEYS[(s.i * 3 + j * 2 + q) % FURN_KEYS.length]](b); }); }
    // 橋頭斑馬線、無橋邊的碼頭／礁石／蘆葦
    let pier = false;
    for (let j = 0; j < 6; j++) { const a = j * Math.PI / 3, rx = Math.cos(a), rz = Math.sin(a), yaw = Math.atan2(rx, rz), nd = s.node0 + 2 * j;
      const hasBridge = Object.keys(bridges).some(k => k.startsWith(nd + '-'));
      if (hasBridge) { const b = builder(smallKit, itemMatrix(nodes[nd].p.x - rx * .02, nodes[nd].p.z - rz * .02, 1, yaw), { type: 'island', island: s.i }, jr); for (let i = 0; i < 5; i++) b.bx(-.16 + i * .08, .008, 0, .045, .006, .2, '#ffffff'); continue; }
      if (!pier && (rz > 0.4 || j === 3)) { pier = true; const b = builder(kit, itemMatrix(cx + rx * R, cz + rz * R, 1, yaw), { type: 'island', island: s.i }, jr);
        for (let i = 0; i < 7; i++) b.bx(0, -.5 - i * .0, .05 + i * .1, .34, .04, .085, i % 2 ? PAL.wood : '#d6a77f');
        [-.16, .16].forEach(x => [.15, .45, .7].forEach(z => b.cy(x, -.85, z, .025, .42, '#8a6a4a')));
        b.rb(.32, -.78, .55, .16, .08, .42, '#ffffff'); b.bx(.32, -.72, .55, .17, .02, .43, PAL.coral); b.cy(.32, -.72, .55, .008, .25, PAL.wood); b.sp(-.16, -.42, .72, .03, PAL.coral);
        for (let i = 0; i < 4; i++) b.bx(0, -.06 - i * .11, -.02 - i * .0, .2, .03, .06, PAL.stone, 0); continue; }
      const b = builder(smallKit, itemMatrix(cx + rx * (R + .2), cz + rz * (R + .2), 1, yaw), { type: 'island', island: s.i }, jr);
      for (let i = 0; i < 3; i++) b.ic((jr() - .5) * 1.2, WATER_Y - TOP + .02, (jr() - .2) * .25, .08 + jr() * .08, i % 2 ? '#b9ada0' : '#a3978a', .7);
      for (let i = 0; i < 6; i++) b.cy((jr() - .5) * 1.4, WATER_Y - TOP - .02, (jr() - .3) * .2, .007, .18 + jr() * .12, i % 2 ? PAL.p3 : PAL.green);
    }
    // 大樹 4–6
    const nt = 4 + Math.floor(jr() * 3);
    for (let t = 0; t < nt; t++) { const a = (t * 2 + (s.i % 2)) % 6 * Math.PI / 3 + Math.PI / 6, r = 1.6;
      const b = builder(kit, itemMatrix(cx + Math.cos(a) * r, cz + Math.sin(a) * r, .55 + jr() * .15, jr() * 6), { type: 'island', island: s.i }, jr); TREES[s.d.tree](b); }
    // 小物件：路燈、盆栽、花、長椅、串燈
    for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3, lx = cx + Math.cos(a) * 1.96, lz = cz + Math.sin(a) * 1.96;
      const b = builder(smallKit, itemMatrix(lx, lz, 1, 0), { type: 'island', island: s.i }, jr); b.cy(0, 0, 0, .018, .42, PAL.ink); b.gs(0, .45, 0, .045); b.dm(0, .47, 0, .05, PAL.ink, .6);
      lamps.push(new V3(lx, TOP + .015, lz));
      for (let f = 1; f < 4; f++) { const a2 = k * Math.PI / 3, e0 = new V3(Math.cos(a), 0, Math.sin(a)).multiplyScalar(1.9), e1 = new V3(Math.cos(a + Math.PI / 3), 0, Math.sin(a + Math.PI / 3)).multiplyScalar(1.9), p = e0.lerp(e1, f / 4);
        const bf = builder(smallKit, itemMatrix(cx + p.x, cz + p.z, 1, 0), { type: 'island', island: s.i }, jr);
        if (f === 2) { bf.cy(0, 0, 0, .05, .07, PAL.coral); bf.ic(0, .11, 0, .055, PAL.p2); } else { bf.ic(0, .04, 0, .045, PAL.p1); bf.sp(0, .08, 0, .018, [PAL.pink, PAL.yellow, '#ffffff'][f % 3]); }
      }
      // 島緣串燈
      for (let f = 0; f < 3; f++) { const e0 = new V3(Math.cos(a), 0, Math.sin(a)).multiplyScalar(R - .02), e1 = new V3(Math.cos(a + Math.PI / 3), 0, Math.sin(a + Math.PI / 3)).multiplyScalar(R - .02), p = e0.lerp(e1, (f + .5) / 3);
        builder(smallKit, itemMatrix(cx + p.x, cz + p.z, 1, 0), { type: 'island', island: s.i }, jr).gs(0, .03, 0, .022, '#fff3cf'); }
    }
    for (let k = 0; k < 2; k++) { const a = (k * 3 + s.i) * Math.PI / 3, x = cx + Math.cos(a) * 1.4, z = cz + Math.sin(a) * 1.4;
      const b = builder(smallKit, itemMatrix(x, z, 1, -a + Math.PI / 2), { type: 'island', island: s.i }, jr); b.bx(0, .06, 0, .26, .025, .08, PAL.wood); b.bx(0, .08, -.035, .26, .06, .015, PAL.wood); b.bx(-.11, 0, 0, .02, .06, .07, PAL.ink); b.bx(.11, 0, 0, .02, .06, .07, PAL.ink); }
  });
  // 海上點綴：小島、燈塔、帆船
  const dj = mulberry32(5);
  [[16, 13], [-17, 11], [22, -4], [-12, 18]].forEach(([x, z], i) => { const b = builder(kit, itemMatrix(center.x + x, center.z + z, 1, 0), { type: 'decor' }, dj);
    b.add('cylinder', 0, WATER_Y - TOP + .05, 0, 1.6, .2, 1.6, '#e3d3ae'); b.ic(0, WATER_Y - TOP + .3, 0, .55, PAL.p2, .6); b.ic(.3, WATER_Y - TOP + .55, .1, .3, PAL.p3);
    if (i === 0) { b.cy(-.3, WATER_Y - TOP + .1, 0, .14, .9, '#ffffff'); b.cy(-.3, WATER_Y - TOP + .45, 0, .145, .15, PAL.coral); b.gs(-.3, WATER_Y - TOP + 1.1, 0, .11); b.co(-.3, WATER_Y - TOP + 1.2, 0, .16, .2, PAL.coral); } });
  [[9, 12, .4], [-8, 14, 2.2], [14, 4, 1]].forEach(([x, z, ry]) => { const b = builder(kit, itemMatrix(center.x + x, center.z + z, 1, ry), { type: 'decor' }, dj);
    b.rb(0, WATER_Y - TOP - .05, 0, .7, .16, .26, '#ffffff'); b.cy(0, WATER_Y - TOP + .1, 0, .015, .7, PAL.wood); b.add('prism', .14, WATER_Y - TOP + .45, 0, .02, .55, .3, PAL.cream, Math.PI / 2); });
}
