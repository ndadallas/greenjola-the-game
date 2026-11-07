// Décor 3D temps réel derrière tous les écrans : ville de nuit dans le brouillard, rendu basse résolution façon PS2.
// La caméra change de plan selon body[data-screen] (posé par main.js), sans toucher à la navigation.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const canvas = document.getElementById('world');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
} catch (e) {
  canvas.remove(); // pas de WebGL : les anciens fonds CSS restent
  throw e;
}
document.body.classList.add('has-world');

const RES = 0.5; // rendu à mi-résolution puis agrandi en pixels nets
const scene = new THREE.Scene();
scene.background = new THREE.Color('#000000');
scene.fog = new THREE.FogExp2(new THREE.Color('#000000'), 0.05);
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);

scene.add(new THREE.HemisphereLight(0x6dff8a, 0x020402, 0.55));
const moon = new THREE.DirectionalLight(0xbfe9ff, 0.35);
moon.position.set(-30, 60, -20);
scene.add(moon);

// ---------- fenêtres : calculées dans le shader à partir de la position monde (taille fixe, quelle que soit la tour) ----------
function windowsMaterial() {
  const m = new THREE.MeshLambertMaterial({ color: 0x0b120d });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
varying vec3 vW;
varying vec3 vN;`)
      .replace('#include <project_vertex>', `#include <project_vertex>
        vec4 wp = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          wp = instanceMatrix * wp;
        #endif
        vW = (modelMatrix * wp).xyz;
        vN = objectNormal;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vW;
varying vec3 vN;`)
      .replace('#include <emissivemap_fragment>', `
        float side = step(0.5, abs(vN.x));
        float u = mix(vW.x, vW.z, side);
        float face = mix(vW.z, vW.x, side);
        vec2 cell = vec2(u / 0.7, vW.y / 1.05);
        vec2 f = fract(cell);
        float win = step(0.28, f.x) * step(f.x, 0.72) * step(0.3, f.y) * step(f.y, 0.78);
        float h = fract(sin(dot(floor(cell), vec2(12.9898, 78.233)) + floor(face * 2.0) * 3.17) * 43758.5453);
        float h2 = fract(h * 91.7);
        vec3 col = h2 < 0.72 ? vec3(0.36, 1.0, 0.31) : (h2 < 0.93 ? vec3(0.9, 1.0, 0.94) : vec3(0.9, 0.22, 0.27));
        float lit = step(h, 0.2) * win * (1.0 - step(0.5, abs(vN.y))) * step(1.0, vW.y);
        totalEmissiveRadiance += col * lit * (0.45 + 0.55 * h2);`);
  };
  return m;
}

// ---------- ville : immeubles instanciés autour de rues en grille ----------
const BLOCK = 14, STREET = 6, N = 9; // N blocs de chaque côté du centre
const box = new THREE.BoxGeometry(1, 1, 1);
box.translate(0, 0.5, 0);
const mats = [windowsMaterial()];
const lists = mats.map(() => []);
let seed = 23;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
for (let bx = -N; bx <= N; bx++) {
  for (let bz = -N; bz <= N; bz++) {
    if (bx === 0 && bz === 0) continue; // place centrale : l'hologramme
    const cx = bx * (BLOCK + STREET), cz = bz * (BLOCK + STREET);
    const near = Math.hypot(bx, bz) < 5; // près du centre : tours plus basses, les caméras y circulent
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const w = BLOCK / 2 - 1 - rnd() * 1.5;
      const d = BLOCK / 2 - 1 - rnd() * 1.5;
      const h = 4 + rnd() * rnd() * (near ? 26 : 42) + (!near && rnd() < 0.08 ? 30 : 0);
      lists[Math.floor(rnd() * mats.length)].push({
        x: cx - BLOCK / 2 + (i + 0.5) * (BLOCK / 2), z: cz - BLOCK / 2 + (j + 0.5) * (BLOCK / 2), w, d, h,
      });
    }
  }
}
const m4 = new THREE.Matrix4();
lists.forEach((list, k) => {
  const mesh = new THREE.InstancedMesh(box, mats[k], list.length);
  list.forEach((b, i) => mesh.setMatrixAt(i, m4.makeScale(b.w, b.h, b.d).setPosition(b.x, 0, b.z)));
  scene.add(mesh);
});

// feux rouges clignotants au sommet des tours (balisage aérien)
const beaconPos = [];
for (const l of lists) for (const b of l) if (b.h > 24) beaconPos.push(b.x, b.h + 0.4, b.z);
const beaconGeo = new THREE.BufferGeometry();
beaconGeo.setAttribute('position', new THREE.Float32BufferAttribute(beaconPos, 3));
const beacons = new THREE.Points(beaconGeo, new THREE.PointsMaterial({ color: 0xff3344, size: 0.9, transparent: true, fog: false }));
scene.add(beacons);

// sol + rues
const SIZE = (2 * N + 1) * (BLOCK + STREET);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(SIZE * 2, SIZE * 2), new THREE.MeshLambertMaterial({ color: 0x030604 }));
ground.rotation.x = -Math.PI / 2;
scene.add(ground);
const grid = new THREE.GridHelper(SIZE, 2 * N + 1, 0x5cff4f, 0x5cff4f);
grid.position.set(-(BLOCK + STREET) / 2, 0.02, -(BLOCK + STREET) / 2);
grid.material.transparent = true;
grid.material.opacity = 0.22;
scene.add(grid);

// ---------- hologramme du logo officiel 23 JOURS PLUS TARD au-dessus de la place ----------
const additive = (color, opacity, extra = {}) => new THREE.MeshBasicMaterial({
  color, transparent: true, opacity, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false, ...extra,
});
const holo = new THREE.Group();
holo.position.set(0, 26, 0);
scene.add(holo);
const logoTex = new THREE.TextureLoader().load('assets/img/logo-23jours.png');
logoTex.colorSpace = THREE.SRGBColorSpace;
const logoPlane = new THREE.Mesh(new THREE.PlaneGeometry(20, 16), additive(0x9dffa0, 0.85, { map: logoTex, fog: false }));
holo.add(logoPlane);
const ring = new THREE.Mesh(new THREE.RingGeometry(12, 12.4, 64), additive(0x5cff4f, 0.5, { fog: false }));
ring.rotation.x = Math.PI / 2;
ring.position.y = -12;
holo.add(ring);
const beam = new THREE.Mesh(new THREE.CylinderGeometry(9, 2, 26, 32, 1, true), additive(0x5cff4f, 0.07));
beam.position.y = 13;
scene.add(beam);

// ---------- projecteurs qui balaient le ciel ----------
const searchlights = [];
for (let i = 0; i < 4; i++) {
  const g = new THREE.Group();
  const a = (i / 4) * Math.PI * 2 + 0.6;
  g.position.set(Math.cos(a) * 70, 0, Math.sin(a) * 70);
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 7, 120, 16, 1, true), additive(i % 2 ? 0xe8fff0 : 0x5cff4f, 0.05));
  cone.position.y = 60;
  g.add(cone);
  g.userData.phase = i * 1.7;
  scene.add(g);
  searchlights.push(g);
}

// ---------- pluie ----------
const RAIN = 2600;
const rainPos = new Float32Array(RAIN * 3);
for (let i = 0; i < RAIN; i++) {
  rainPos[i * 3] = (Math.random() - 0.5) * 160;
  rainPos[i * 3 + 1] = Math.random() * 80;
  rainPos[i * 3 + 2] = (Math.random() - 0.5) * 160;
}
const rainGeo = new THREE.BufferGeometry();
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rain = new THREE.Points(rainGeo, new THREE.PointsMaterial({ color: 0xa6ff8f, size: 0.18, transparent: true, opacity: 0.55 }));
scene.add(rain);

// ---------- plans de caméra par écran ----------
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const SHOTS = { // rues : x ou z = ±10, ±30… (entre les blocs)
  boot:       { pos: V(0, 140, 0.1), look: V(0, 0, 0), fog: '#000000', density: 0.05 },
  title:      { pos: V(-10, 7, 95), look: V(-4, 17, 0), fog: '#06160b', density: 0.016, fly: 1 },
  menu:       { pos: V(-62, 16, 62), look: V(0, 8, 0), fog: '#05120a', density: 0.014, orbit: 0.025 },
  difficulty: { pos: V(40, 38, -48), look: V(0, 22, 0), fog: '#061014', density: 0.016, orbit: -0.02 },
  story:      { pos: V(-10, 3, 40), look: V(0, 6, 0), fog: '#020402', density: 0.05 },
  albums:     { pos: V(10, 13, 10), look: V(-10, 0, -14), fog: '#0a1114', density: 0.02, pan: 0.35, fov: 72 },
  players:    { pos: V(-10, 9, 32), look: V(-10, 2, -10), fog: '#0a1114', density: 0.02, pan: 0.45, fov: 78 },
  release:    { pos: V(30, 34, 70), look: V(90, 8, -10), fog: '#07160b', density: 0.012, sway: 1 },
  shop:       { pos: V(-30, 30, -70), look: V(-90, 6, 10), fog: '#07160b', density: 0.014, sway: 1 },
  options:    { pos: V(0, 90, 60), look: V(0, 0, 0), fog: '#030805', density: 0.02, orbit: 0.01 },
  credits:    { pos: V(-50, 8, 70), look: V(-120, 50, 40), fog: '#020803', density: 0.012, rise: 1 },
};
const ALBUM_FOG = { rd: '#1a0608', xp: '#070a1c', goty: '#101210', unknown: '#06140a' };
const isCam = (n) => n === 'albums' || n === 'players';

const state = { pos: SHOTS.boot.pos.clone(), look: SHOTS.boot.look.clone(), fov: 55, density: 0.05 };
const targetFog = new THREE.Color('#000000');
let shotName = 'boot', shotTime = 0;

function setShot(name, cut) {
  if (!SHOTS[name]) name = 'menu';
  if (name !== shotName) shotTime = 0;
  shotName = name;
  const s = SHOTS[name];
  let fog = s.fog;
  if (name === 'albums') fog = ALBUM_FOG[document.getElementById('albums')?.dataset.tint] || fog;
  else if (document.body.dataset.mode === '23 MODE' && !isCam(name)) fog = '#1a0507';
  targetFog.set(fog);
  if (cut) { // les caméras de surveillance coupent net, comme un changement de flux
    state.pos.copy(s.pos); state.look.copy(s.look); state.fov = s.fov || 55; state.density = s.density;
    scene.fog.color.copy(targetFog);
  }
}

new MutationObserver(() => {
  const n = document.body.dataset.screen;
  setShot(n, isCam(n) && n !== shotName);
}).observe(document.body, { attributes: true, attributeFilter: ['data-screen', 'data-mode'] });
const albumsEl = document.getElementById('albums');
if (albumsEl) new MutationObserver(() => setShot(shotName)).observe(albumsEl, { attributes: true, attributeFilter: ['data-tint'] });
setShot(document.body.dataset.screen || 'boot', true);

// léger parallaxe à la souris
const mouse = { x: 0, y: 0 };
addEventListener('pointermove', (e) => {
  mouse.x = e.clientX / innerWidth - 0.5;
  mouse.y = e.clientY / innerHeight - 0.5;
}, { passive: true });

function resize() {
  renderer.setPixelRatio(1);
  renderer.setSize(Math.max(1, Math.round(innerWidth * RES)), Math.max(1, Math.round(innerHeight * RES)), false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

const clock = new THREE.Clock();
const goalPos = new THREE.Vector3(), goalLook = new THREE.Vector3();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.1);
  const speed = reduce ? 0.25 : 1;
  const t = clock.elapsedTime * speed;
  shotTime += dt * speed;
  const s = SHOTS[shotName];

  goalPos.copy(s.pos);
  goalLook.copy(s.look);
  if (s.orbit) {
    const r = Math.hypot(s.pos.x, s.pos.z), a = Math.atan2(s.pos.z, s.pos.x) + shotTime * s.orbit;
    goalPos.x = Math.cos(a) * r;
    goalPos.z = Math.sin(a) * r;
  }
  if (s.fly) goalPos.z = s.pos.z - ((shotTime * 2.2) % 40); // avance dans l'avenue ; le saut de boucle se perd dans le brouillard
  if (s.sway) { goalPos.x += Math.sin(shotTime * 0.2) * 2.5; goalPos.y += Math.sin(shotTime * 0.31) * 1.2; }
  if (s.rise) goalPos.y = s.pos.y + Math.min(shotTime * 1.2, 60);
  if (s.pan) { // caméra de surveillance : balayage motorisé lent
    const p = Math.sin(shotTime * 0.25) * s.pan * 12;
    goalLook.x += p; goalLook.z -= p;
  }
  goalPos.x += mouse.x * 4;
  goalPos.y -= mouse.y * 2;

  const k = isCam(shotName) ? 1 : 1 - Math.pow(0.0015, dt); // amorti indépendant du framerate
  state.pos.lerp(goalPos, k);
  state.look.lerp(goalLook, k);
  state.fov += ((s.fov || 55) - state.fov) * k;
  state.density += (s.density - state.density) * k;
  scene.fog.color.lerp(targetFog, 1 - Math.pow(0.02, dt));
  scene.fog.density = state.density;
  scene.background.copy(scene.fog.color);

  camera.position.copy(state.pos);
  camera.lookAt(state.look);
  if (Math.abs(camera.fov - state.fov) > 0.01) { camera.fov = state.fov; camera.updateProjectionMatrix(); }

  beacons.material.opacity = Math.sin(t * 2.4) > 0.2 ? 1 : 0.15;
  holo.rotation.y = t * 0.35;
  logoPlane.material.opacity = 0.75 + Math.sin(t * 9) * 0.05 - (Math.random() < 0.02 ? 0.4 : 0); // scintillement d'hologramme
  ring.scale.setScalar(1 + Math.sin(t * 1.3) * 0.04);
  for (const g of searchlights) {
    g.rotation.z = Math.sin(t * 0.3 + g.userData.phase) * 0.35;
    g.rotation.x = Math.cos(t * 0.23 + g.userData.phase) * 0.25;
  }
  const p = rainGeo.attributes.position.array;
  for (let i = 1; i < p.length; i += 3) {
    p[i] -= dt * 38 * speed;
    if (p[i] < 0) p[i] += 80;
  }
  rainGeo.attributes.position.needsUpdate = true;
  rain.position.set(camera.position.x, 0, camera.position.z);

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
