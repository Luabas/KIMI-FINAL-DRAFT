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
  uniform,
  float,
  vec3,
  pow,
  smoothstep,
  atan,
} from 'three/tsl'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

// ════════════════════════════════════════════════════════════════════════════
// AURA — Milky Opalescent Glass Torus
// Geometry unchanged. Material: translucent pearlescent glass.
// ════════════════════════════════════════════════════════════════════════════

// ─── Scene / Camera / Renderer ────────────────────────────────────────────
const scene = new THREE.Scene()
scene.background = null

const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 1, 2000)
camera.position.set(-2.5, 0.0, 5.5)
camera.lookAt(0, 0, 0)

const renderer = new THREE.WebGPURenderer({ antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
renderer.toneMapping = THREE.AgXToneMapping
renderer.autoClear = true

const canvasContainer = document.getElementById('home-canvas')

if (canvasContainer) {
  canvasContainer.appendChild(renderer.domElement)
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  renderer.domElement.style.display = 'block'
}

await renderer.init()

// Warm cream environment — soft editorial reflections
const envScene = new RoomEnvironment()
const pmrem = new THREE.PMREMGenerator(renderer)
scene.environment = pmrem.fromSceneAsync
  ? (await pmrem.fromSceneAsync(envScene)).texture
  : pmrem.fromScene(envScene).texture

// ─── Geometry — EXACTLY as before ─────────────────────────────────────────
const geometry = new THREE.TorusKnotGeometry(
  1.0,   // radius
  0.155, // tube
  300,   // tubularSegments
  64,    // radialSegments
  3,     // p
  7,     // q
)
geometry.computeTangents()

// ─── Subtle Surface Displacement ──────────────────────────────────────────
const uSpiralFrequency = uniform(5)
const uSpiralTwist = uniform(5)
const uSpiralAmplitude = uniform(0.015)
const uSpiralSpeed = uniform(-0.3)

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
  const perturbedLocal = normalLocal
    .sub(tangentLocal.mul(ddu))
    .sub(bitangentLocal.mul(ddv))
    .normalize()
  return modelNormalMatrix.mul(perturbedLocal).normalize()
})()

// ─── Milky Opalescent Glass Material ──────────────────────────────────────
const glassMaterial = new THREE.MeshPhysicalNodeMaterial()

// Original opalescent palette — from fullsite backup
const opalIvory   = uniform(color(new THREE.Color(0xf4ece0)))
const opalCream   = uniform(color(new THREE.Color(0xe6dccb)))
const opalBlush   = uniform(color(new THREE.Color(0xf6d2da)))
const opalLemon   = uniform(color(new THREE.Color(0xf3edc4)))
const opalAqua    = uniform(color(new THREE.Color(0xc4e6e0)))
const opalLilac   = uniform(color(new THREE.Color(0xd8cdec)))
const opalMint    = uniform(color(new THREE.Color(0xcce8d4)))
const opalPearl   = uniform(color(new THREE.Color(0xfdfaff)))

// Original spectral fire — full 7-stop rainbow
const opalFireRed    = uniform(color(new THREE.Color(0xff3b6b)))
const opalFireOrange = uniform(color(new THREE.Color(0xff9e3d)))
const opalFireGold   = uniform(color(new THREE.Color(0xffe24a)))
const opalFireGreen  = uniform(color(new THREE.Color(0x35e0a0)))
const opalFireCyan   = uniform(color(new THREE.Color(0x36c6ff)))
const opalFireBlue   = uniform(color(new THREE.Color(0x4a6bff)))
const opalFireViolet = uniform(color(new THREE.Color(0xb44dff)))

const opalSpectrum = (phase) => {
  const s = phase.fract()
  const c1 = mix(opalFireRed,    opalFireOrange, smoothstep(0.0,  0.16, s))
  const c2 = mix(c1,             opalFireGold,   smoothstep(0.16, 0.33, s))
  const c3 = mix(c2,             opalFireGreen,  smoothstep(0.33, 0.5,  s))
  const c4 = mix(c3,             opalFireCyan,   smoothstep(0.5,  0.66, s))
  const c5 = mix(c4,             opalFireBlue,   smoothstep(0.66, 0.82, s))
  const c6 = mix(c5,             opalFireViolet, smoothstep(0.82, 1.0,  s))
  return c6
}

// Original color node — EXACT from backup
const opalColorNode = Fn(() => {
  const t = time.mul(0.12)
  const n = normalLocal

  const ringAngle = atan(positionLocal.x, positionLocal.z)
  const groove = ringAngle.mul(5).add(positionLocal.y.mul(5).mul(1.4))

  const cell = sin(positionLocal.x.mul(2.1)).mul(sin(positionLocal.y.mul(1.7)))
    .mul(sin(positionLocal.z.mul(2.4).add(1.3)))
  const cellPhase = cell.mul(0.5).add(0.5)

  const filmShift = n.x.mul(1.6).add(n.y.mul(1.3)).add(n.z.mul(2.1)).mul(0.16)

  const firePhase = cellPhase.mul(0.6).add(groove.mul(0.03)).add(filmShift).add(t)
  const fire = opalSpectrum(firePhase)

  const sweep = sin(positionLocal.dot(vec3(2.6, 2.2, 3.1)).add(t.mul(1.4)))
    .mul(0.5).add(0.5)
  const fire2 = opalSpectrum(firePhase.mul(1.35).add(0.4))
  const fireMixed = mix(fire, fire2, sweep.mul(0.4))

  const flash = pow(sin(cell.mul(1.6).add(t.mul(1.4))).mul(0.5).add(0.5), float(1.4))
  const fireAmount = float(0.45).add(flash.mul(0.5))

  const bodyShimmer = sin(filmShift.mul(6.0).add(t)).mul(0.5).add(0.5)
  const body = mix(opalIvory, mix(opalAqua, opalLilac, bodyShimmer), float(0.22))

  const surface = mix(body, fireMixed, fireAmount.mul(0.85))

  const shadow = sin(groove.add(t)).mul(0.5).add(0.5)
  return mix(surface, opalCream, shadow.mul(0.14))
})()

glassMaterial.colorNode = opalColorNode
glassMaterial.positionNode = spiralDisplacement
glassMaterial.normalNode = spiralNormal

// Frosted translucent glass — color glows from within
glassMaterial.roughness = 0.32
glassMaterial.metalness = 0.0
glassMaterial.transmission = 0.75
glassMaterial.thickness = 2.2
glassMaterial.ior = 1.48
glassMaterial.dispersion = 0.3

glassMaterial.clearcoat = 0.15
glassMaterial.clearcoatRoughness = 0.3

glassMaterial.iridescence = 0.6
glassMaterial.iridescenceIOR = 1.6
glassMaterial.iridescenceThicknessRange = [200, 500]

glassMaterial.specularIntensity = 0.8
glassMaterial.specularColor.set(0xfff8f0)
glassMaterial.reflectivity = 0.3
glassMaterial.envMapIntensity = 0.6

// Neutral attenuation — no warm tint on transmitted light
glassMaterial.attenuationDistance = 0.6
glassMaterial.attenuationColor.set(0xffffff)

// Original spectral inner fire glow
const opalEmissiveNode = Fn(() => {
  const t = time.mul(0.15)
  const cell = sin(positionLocal.x.mul(2.1)).mul(sin(positionLocal.y.mul(1.7)))
    .mul(sin(positionLocal.z.mul(2.4).add(1.3)))
  const phase = cell.mul(0.5).add(0.5).mul(0.6).add(t)
  const flash = pow(sin(cell.mul(1.6).sub(t.mul(1.4))).mul(0.5).add(0.5), float(2.0))
  return opalSpectrum(phase).mul(flash).mul(0.35)
})()

glassMaterial.emissiveNode = opalEmissiveNode

// ─── Mesh ─────────────────────────────────────────────────────────────────
const mesh = new THREE.Mesh(geometry, glassMaterial)
scene.add(mesh)

// ─── Warm Editorial Lighting ──────────────────────────────────────────────
// Large soft ambient base
scene.add(new THREE.AmbientLight(0xfff5e8, 0.5))

// Hemisphere: warm sky, cream ground
scene.add(new THREE.HemisphereLight(0xfff8f0, 0xf0e8d8, 0.7))

// Softbox key: large warm source from upper-left
const keyLight = new THREE.DirectionalLight(0xfff0e0, 2.0)
keyLight.position.set(4, 5, 3)
scene.add(keyLight)

// Gentle front fill
const fillLight = new THREE.DirectionalLight(0xf5f0ff, 0.8)
fillLight.position.set(-2, 1, 5)
scene.add(fillLight)

// Subtle rim from back-right
const rimLight = new THREE.DirectionalLight(0xffffff, 0.5)
rimLight.position.set(-3, 3, -4)
scene.add(rimLight)

// Warm bounce from below
const bounceLight = new THREE.PointLight(0xf8e8d0, 0.6, 12)
bounceLight.position.set(0, -4, 1)
scene.add(bounceLight)

await renderer.compileAsync(scene, camera)
if (window.dismissLoader) window.dismissLoader()

// ─── Mouse Interaction ────────────────────────────────────────────────────
const mouse = new THREE.Vector2(0, 0)
const targetRotation = new THREE.Vector2(0, 0)
const currentRotation = new THREE.Vector2(0, 0)

addEventListener('pointermove', (e) => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1
  mouse.y = -(e.clientY / innerHeight) * 2 + 1
})

// ─── Resize ───────────────────────────────────────────────────────────────
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
requestAnimationFrame(() => requestAnimationFrame(resize))

// ─── Animation Loop ───────────────────────────────────────────────────────
let last = performance.now()

function animate() {
  requestAnimationFrame(animate)

  const now = performance.now()
  const delta = Math.min((now - last) / 1000, 0.1)
  last = now

  // Mouse follow only — no auto-spin, no bob
  targetRotation.x = -mouse.y * 0.12
  targetRotation.y = mouse.x * 0.12

  const lerpAlpha = 1 - Math.exp(-2.5 * delta)
  currentRotation.x += (targetRotation.x - currentRotation.x) * lerpAlpha
  currentRotation.y += (targetRotation.y - currentRotation.y) * lerpAlpha

  mesh.rotation.x = currentRotation.x
  mesh.rotation.y = currentRotation.y

  renderer.render(scene, camera)
}
animate()
