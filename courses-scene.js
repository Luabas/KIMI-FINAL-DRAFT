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

const scene = new THREE.Scene()
scene.background = null

const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 1, 2000)
camera.position.set(0, 0, 7.5)

const renderer = new THREE.WebGPURenderer({ antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
renderer.toneMapping = THREE.AgXToneMapping
renderer.autoClear = true

const canvasContainer = document.getElementById('courses-canvas')

if (canvasContainer) {
  canvasContainer.appendChild(renderer.domElement)
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  renderer.domElement.style.display = 'block'
}

await renderer.init()

const geometry = new THREE.TorusGeometry(1, 0.38, 32, 64)
geometry.computeTangents()

// Spiral displacement (same pattern as method/about/home)
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

// ─── Silver Material ──────────────────────────────────────────────────────────
const silverColorA = uniform(color(new THREE.Color(0x8f96a0)))
const silverColorB = uniform(color(new THREE.Color(0xeef2f6)))

const material = new THREE.MeshPhysicalNodeMaterial()

material.colorNode = Fn(() => {
  const t = time.mul(0.3)
  const p = positionLocal
  const sheen = sin(p.y.mul(4).add(t)).mul(0.5).add(0.5)
  return mix(silverColorA, silverColorB, sheen)
})()

material.roughness = 0.18
material.metalness = 0.9
material.specularIntensity = 1.5
material.specularColor.set(0xffffff)

material.positionNode = spiralDisplacement
material.normalNode = spiralNormal

const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

// Environment
const pmremGenerator = new THREE.PMREMGenerator(renderer)
scene.environment = pmremGenerator.fromScene(new RoomEnvironment()).texture

// Lights
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

// Mouse
const mouse = new THREE.Vector2(0, 0)
const targetRotation = new THREE.Vector2(0, 0)
const currentRotation = new THREE.Vector2(0, 0)

addEventListener('pointermove', (e) => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1
  mouse.y = -(e.clientY / innerHeight) * 2 + 1
})

// Resize
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

// Animation
let last = performance.now()

function animate() {
  requestAnimationFrame(animate)

  const now = performance.now()
  const delta = Math.min((now - last) / 1000, 0.1)
  last = now

  targetRotation.x = -mouse.y * 0.2
  targetRotation.y = mouse.x * 0.2

  const lerpAlpha = 1 - Math.exp(-4 * delta)
  currentRotation.x += (targetRotation.x - currentRotation.x) * lerpAlpha
  currentRotation.y += (targetRotation.y - currentRotation.y) * lerpAlpha

  mesh.rotation.x = currentRotation.x
  mesh.rotation.y = currentRotation.y

  renderer.render(scene, camera)
}
animate()
