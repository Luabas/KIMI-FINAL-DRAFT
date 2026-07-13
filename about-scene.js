import * as THREE from 'three/webgpu'
import {
  color,
  positionLocal,
  normalLocal,
  tangentLocal,
  bitangentLocal,
  modelNormalMatrix,
  time,
  Fn,
  sin,
  cos,
  mix,
  uv,
  mx_fractal_noise_float,
  uniform,
  float,
  vec2,
} from 'three/tsl'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

// ─── Scene Setup ──────────────────────────────────────────────────────────────
const scene = new THREE.Scene()
scene.background = null

const camera = new THREE.PerspectiveCamera(30, 1, 1, 2000)
camera.position.set(0, 0, 8.5)

const renderer = new THREE.WebGPURenderer({ antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
renderer.toneMapping = THREE.AgXToneMapping
renderer.autoClear = true

const canvasContainer = document.getElementById('about-canvas')

if (canvasContainer) {
  canvasContainer.appendChild(renderer.domElement)
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  renderer.domElement.style.display = 'block'
}

await renderer.init()

// ─── Twisted Torus Knot Geometry (matches inspiration form) ───────────────────
const geometry = new THREE.TorusKnotGeometry(
  1.0,   // radius
  0.38,  // tube — thick, ceramic feel
  160,   // tubularSegments — smooth
  32,    // radialSegments
  2,     // p — twist parameter
  3      // q — twist parameter
)
geometry.computeTangents()

// ─── Spiral displacement (swirl + movement effect) ────────────────────────────
const uSpiralFrequency = uniform(5)
const uSpiralTwist = uniform(5)
const uSpiralAmplitude = uniform(0.02)
const uSpiralSpeed = uniform(-0.5)

const spiralDisplacement = Fn(() => {
  const u = uv().x.mul(float(Math.PI * 2))
  const v = uv().y.mul(float(Math.PI * 2))
  const t = time.mul(uSpiralSpeed)
  const wave = sin(u.mul(uSpiralFrequency).add(v.mul(uSpiralTwist)).sub(t))
  return positionLocal.add(normalLocal.mul(wave.mul(uSpiralAmplitude)))
})()

const spiralNormal = Fn(() => {
  const u = uv().x.mul(float(Math.PI * 2))
  const v = uv().y.mul(float(Math.PI * 2))
  const t = time.mul(uSpiralSpeed)
  const phase = u.mul(uSpiralFrequency).add(v.mul(uSpiralTwist)).sub(t)
  const grad = cos(phase).mul(uSpiralAmplitude)
  const ddu = grad.mul(uSpiralFrequency).mul(float(Math.PI * 2))
  const ddv = grad.mul(uSpiralTwist).mul(float(Math.PI * 2))
  const perturbedLocal = normalLocal.sub(tangentLocal.mul(ddu)).sub(bitangentLocal.mul(ddv)).normalize()
  return modelNormalMatrix.mul(perturbedLocal).normalize()
})()

// ─── Clean Matte Sage Ceramic Material ────────────────────────────────────────
// Single, pale sage tone — no complex multi-colour nodes.
// The visual interest comes from the twisted geometry + strong lighting.
const material = new THREE.MeshPhysicalNodeMaterial()

// Base colour: the exact pale sage-green from the inspiration
const sageBase = uniform(color(new THREE.Color(0xadbfa8))) // pale sage
const sageDeep = uniform(color(new THREE.Color(0x97ad90))) // slightly deeper for variation

material.colorNode = Fn(() => {
  const t = time.mul(0.06)
  const p = positionLocal

  // Very subtle tonal shift across the surface — almost imperceptible
  const band = sin(p.y.mul(3.0).add(p.x.mul(1.5)).add(t))
    .mul(0.5).add(0.5)

  return mix(sageBase, sageDeep, band.mul(0.15)) // only 15% variation — keeps it clean
})()

// Matte ceramic: high roughness, zero metalness
material.roughness = 0.88
material.metalness = 0.0
material.clearcoat = 0.0
material.sheen = 0.0
material.specularIntensity = 0.6
material.specularColor.set(0xc8d4c0)

// Translucency: very faint SSS-like glow at thin edges (clay/ceramic feel)
material.transmission = 0.0
material.thickness = 0.0

// Subtle warm inner glow — like light diffusing through fine ceramic
material.emissiveNode = Fn(() => {
  const n = normalLocal
  // Glow strongest where surface faces away (crevice warmth)
  const facing = n.z.mul(0.5).add(0.5) // 0 = back-facing crevices, 1 = front
  const creviceGlow = float(1.0).sub(facing).mul(0.06) // very faint
  return color(0xd4e0cc).mul(creviceGlow)
})()

material.positionNode = spiralDisplacement
material.normalNode = spiralNormal

// ─── Mesh ─────────────────────────────────────────────────────────────────────
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

// ─── Environment (softer than main scene — less metallic reflection needed) ───
const pmremGenerator = new THREE.PMREMGenerator(renderer)
const envScene = new RoomEnvironment()
scene.environment = pmremGenerator.fromScene(envScene).texture

// ─── Lighting: strong directional for dramatic definition ─────────────────────
// Key light: warm, bright, front-right — creates the ridge highlights
const keyLight = new THREE.DirectionalLight(0xfff5e8, 4.0)
keyLight.position.set(3, 4, 5)
scene.add(keyLight)

// Fill light: cooler, softer, front-left — fills the shadows gently
const fillLight = new THREE.DirectionalLight(0xd8e4f0, 1.2)
fillLight.position.set(-4, 1, 3)
scene.add(fillLight)

// Rim light: back-top — defines the silhouette edge
const rimLight = new THREE.DirectionalLight(0xffffff, 2.5)
rimLight.position.set(0, 5, -4)
scene.add(rimLight)

// Hemisphere ambient for soft overall illumination
const hemiLight = new THREE.HemisphereLight(0xf0f0e8, 0xc8c4b8, 1.5)
scene.add(hemiLight)

// Point light below: warm bounce light (like light reflecting off the ground)
const bounceLight = new THREE.PointLight(0xf0e8d8, 1.0, 15)
bounceLight.position.set(0, -3, 2)
scene.add(bounceLight)

await renderer.compileAsync(scene, camera)
if (window.dismissLoader) window.dismissLoader()

// ─── Mouse Interaction ────────────────────────────────────────────────────────
const mouse = new THREE.Vector2(0, 0)
const targetRotation = new THREE.Vector2(0, 0)
const currentRotation = new THREE.Vector2(0, 0)

addEventListener('pointermove', (e) => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1
  mouse.y = -(e.clientY / innerHeight) * 2 + 1
})

// ─── Resize ──────────────────────────────────────────────────────────────────
function resize() {
  if (!canvasContainer) return
  const w = canvasContainer.offsetWidth || innerWidth
  const h = canvasContainer.offsetHeight || innerHeight
  if (w === 0 || h === 0) return
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h, false)
}
resize()
addEventListener('resize', resize)
// Retry once after layout settles
requestAnimationFrame(() => requestAnimationFrame(resize))

// ─── Animation Loop ──────────────────────────────────────────────────────────
let last = performance.now()

function animate() {
  requestAnimationFrame(animate)

  const now = performance.now()
  const delta = Math.min((now - last) / 1000, 0.1)
  last = now

  // Mouse-follow rotation (snappy, tracks pointer)
  targetRotation.x = -mouse.y * 0.2
  targetRotation.y = mouse.x * 0.2

  const lerpAlpha = 1 - Math.exp(-4 * delta)
  currentRotation.x += (targetRotation.x - currentRotation.x) * lerpAlpha
  currentRotation.y += (targetRotation.y - currentRotation.y) * lerpAlpha

  mesh.rotation.set(currentRotation.x, currentRotation.y, 0)

  renderer.render(scene, camera)
}
animate()
