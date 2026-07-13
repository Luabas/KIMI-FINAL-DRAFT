import * as THREE from 'three/webgpu'
import {
  color,
  positionLocal,
  time,
  Fn,
  sin,
  mix,
  uniform,
} from 'three/tsl'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

// ════════════════════════════════════════════════════════════════════════════
// Pricing Card Scenes — exact courses-page metallic, pearl colors
// ════════════════════════════════════════════════════════════════════════════

const CARDS = [
  {
    id: 'card1-canvas',
    p: 2, q: 3,
    colorA: 0xc8dcc0,  // sage
    colorB: 0x88c088,  // jade
  },
  {
    id: 'card2-canvas',
    p: 2, q: 5,
    colorA: 0xd0c8e8,  // lavender
    colorB: 0xa888d0,  // purple
  },
  {
    id: 'card3-canvas',
    p: 2, q: 7,
    colorA: 0xe8c8c8,  // blush
    colorB: 0xd08890,  // rose
  },
]

for (const cfg of CARDS) {
  const container = document.getElementById(cfg.id)
  if (!container) continue

  const scene = new THREE.Scene()
  scene.background = null

  const camera = new THREE.PerspectiveCamera(30, 1, 1, 2000)
  camera.position.set(0, 0, 9.0)

  const renderer = new THREE.WebGPURenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
  renderer.toneMapping = THREE.AgXToneMapping
  renderer.autoClear = true

  container.appendChild(renderer.domElement)
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  renderer.domElement.style.display = 'block'

  await renderer.init()

  // ─── Geometry ───────────────────────────────────────────────────────────
  const geometry = new THREE.TorusKnotGeometry(1.0, 0.225, 160, 32, cfg.p, cfg.q)

  // ─── Colors ─────────────────────────────────────────────────────────────
  const colA = uniform(color(new THREE.Color(cfg.colorA)))
  const colB = uniform(color(new THREE.Color(cfg.colorB)))

  // ─── Material: EXACT copy of courses silver, different colors ───────────
  const material = new THREE.MeshPhysicalNodeMaterial()

  material.colorNode = Fn(() => {
    const t = time.mul(0.3)
    const p = positionLocal
    const sheen = sin(p.y.mul(4).add(t)).mul(0.5).add(0.5)
    return mix(colA, colB, sheen)
  })()

  // EXACT courses-page values
  material.roughness = 0.18
  material.metalness = 0.9
  material.specularIntensity = 1.5
  material.specularColor.set(0xffffff)

  // ─── Mesh ───────────────────────────────────────────────────────────────
  const mesh = new THREE.Mesh(geometry, material)
  mesh.rotation.x = 0.05
  scene.add(mesh)

  // ─── Mouse — gentle follow, no auto-spin ────────────────────────────────
  const mouse = new THREE.Vector2(0, 0)
  const targetRot = new THREE.Vector2(0, 0)
  const currentRot = new THREE.Vector2(0, 0)

  container.addEventListener('pointermove', (e) => {
    const rect = container.getBoundingClientRect()
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = ((e.clientY - rect.top) / rect.height) * 2 - 1
  })

  // ─── Environment: EXACT courses-page setup ──────────────────────────────
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment()).texture

  // ─── Lights: EXACT courses-page SpotLights ──────────────────────────────
  const keyLight = new THREE.SpotLight(0xfff0e0, 8, 30, Math.PI / 4, 0.5, 1)
  keyLight.position.set(4, 3, 5)
  scene.add(keyLight)

  const fillLight = new THREE.SpotLight(0xd0e0ff, 3, 30, Math.PI / 3, 0.7, 1)
  fillLight.position.set(-5, 1, 3)
  scene.add(fillLight)

  const rimLight = new THREE.SpotLight(0xffffff, 6, 30, Math.PI / 4, 0.4, 1)
  rimLight.position.set(0, 4, -5)
  scene.add(rimLight)

  await renderer.compileAsync(scene, camera)
  if (window.dismissLoader) window.dismissLoader()

  // ─── Resize ─────────────────────────────────────────────────────────────
  function resize() {
    const w = container.offsetWidth || 300
    const h = container.offsetHeight || 300
    if (w === 0 || h === 0) return
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h, false)
  }
  resize()

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => resize()).observe(container)
  } else {
    addEventListener('resize', resize)
  }
  requestAnimationFrame(() => requestAnimationFrame(resize))

  // ─── Animation — no auto-spin, mouse follow only ───────────────────────
  let last = performance.now()

  function animate() {
    requestAnimationFrame(animate)

    const now = performance.now()
    const delta = Math.min((now - last) / 1000, 0.1)
    last = now

    // Gentle mouse-follow rotation (no auto-spin)
    targetRot.x = -mouse.y * 0.2
    targetRot.y = mouse.x * 0.2

    const lerpAlpha = 1 - Math.exp(-4 * delta)
    currentRot.x += (targetRot.x - currentRot.x) * lerpAlpha
    currentRot.y += (targetRot.y - currentRot.y) * lerpAlpha

    mesh.rotation.x = 0.05 + currentRot.x
    mesh.rotation.y = currentRot.y

    renderer.render(scene, camera)
  }
  animate()
}
