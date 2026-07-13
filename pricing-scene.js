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
} from 'three/tsl'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

// ─── Scene Setup ──────────────────────────────────────────────────────────────
const scene = new THREE.Scene()
scene.background = null

const camera = new THREE.PerspectiveCamera(30, 1, 1, 2000)
camera.position.set(0, 0, 7.5)

const renderer = new THREE.WebGPURenderer({ antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
renderer.toneMapping = THREE.AgXToneMapping
renderer.autoClear = true

const canvasContainer = document.getElementById('pricing-canvas')

if (canvasContainer) {
  canvasContainer.appendChild(renderer.domElement)
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  renderer.domElement.style.display = 'block'
}

await renderer.init()

// ─── Geometry ─────────────────────────────────────────────────────────────────
const geometry = new THREE.TorusKnotGeometry(1.0, 0.38, 200, 48, 3, 4)
geometry.computeTangents()

// ─── Spiral Displacement ──────────────────────────────────────────────────────
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
  const perturbedLocal = normalLocal
    .sub(tangentLocal.mul(ddu))
    .sub(bitangentLocal.mul(ddv))
    .normalize()
  return modelNormalMatrix.mul(perturbedLocal).normalize()
})()

// ─── Warm Champagne Gold Material ─────────────────────────────────────────────
const material = new THREE.MeshPhysicalNodeMaterial()

const goldLight = uniform(color(new THREE.Color(0xe8d5a3)))  // pale champagne
const goldDeep = uniform(color(new THREE.Color(0xc4a35a)))   // deeper gold
const goldWarm = uniform(color(new THREE.Color(0xd4b896)))   // warm amber

material.colorNode = Fn(() => {
  const t = time.mul(0.08)
  const p = positionLocal

  // Broad warm shift across the surface
  const band = sin(p.y.mul(3.0).add(p.x.mul(1.5)).add(t))
    .mul(0.5).add(0.5)

  // Subtle warm-to-cool variation
  const shift = cos(p.z.mul(2.0).add(p.x.mul(1.2)).sub(t.mul(0.7)))
    .mul(0.5).add(0.5)

  const base = mix(goldLight, goldDeep, band.mul(0.35))
  return mix(base, goldWarm, shift.mul(0.2))
})()

material.roughness = 0.35
material.metalness = 0.75
material.clearcoat = 0.3
material.clearcoatRoughness = 0.25
material.specularIntensity = 1.2
material.specularColor.set(0xfff0d0)
material.envMapIntensity = 0.9
material.sheen = 0.4
material.sheenRoughness = 0.35
material.sheenColor.set(0xf0dcc0)

material.positionNode = spiralDisplacement
material.normalNode = spiralNormal

// ─── Mesh ─────────────────────────────────────────────────────────────────────
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

// ─── Environment ──────────────────────────────────────────────────────────────
const pmremGenerator = new THREE.PMREMGenerator(renderer)
const envScene = new RoomEnvironment()
scene.environment = pmremGenerator.fromScene(envScene).texture

// ─── Lighting ─────────────────────────────────────────────────────────────────
const keyLight = new THREE.DirectionalLight(0xfff5e0, 4.0)
keyLight.position.set(3, 4, 5)
scene.add(keyLight)

const fillLight = new THREE.DirectionalLight(0xe0e8f0, 1.5)
fillLight.position.set(-4, 1, 3)
scene.add(fillLight)

const rimLight = new THREE.DirectionalLight(0xffffff, 2.5)
rimLight.position.set(0, 5, -4)
scene.add(rimLight)

const hemiLight = new THREE.HemisphereLight(0xf5f0e8, 0xd8d0c0, 1.2)
scene.add(hemiLight)

const bounceLight = new THREE.PointLight(0xf0e0c8, 0.8, 15)
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
requestAnimationFrame(() => requestAnimationFrame(resize))

// ─── Animation Loop ──────────────────────────────────────────────────────────
let last = performance.now()

function animate() {
  requestAnimationFrame(animate)

  const now = performance.now()
  const delta = Math.min((now - last) / 1000, 0.1)
  last = now

  targetRotation.x = -mouse.y * 0.12
  targetRotation.y = mouse.x * 0.12

  const lerpAlpha = 1 - Math.exp(-3 * delta)
  currentRotation.x += (targetRotation.x - currentRotation.x) * lerpAlpha
  currentRotation.y += (targetRotation.y - currentRotation.y) * lerpAlpha

  mesh.rotation.set(currentRotation.x, currentRotation.y, 0)

  renderer.render(scene, camera)
}
animate()
