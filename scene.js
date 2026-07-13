import * as THREE from 'three/webgpu'
import {
  color,
  positionWorld,
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
import Stats from 'stats-gl'


// ─── Params ──────────────────────────────────────────────────────────────────
const params = {
  interactionMultiplier: 0.2,
  lerpSpeed: 4,

  fov: 30,
  cameraZ: 7.5,
  debug: false,
}

// ─── Scene Setup ──────────────────────────────────────────────────────────────
const scene = new THREE.Scene()
scene.background = null // transparent — CSS section backgrounds show through

const camera = new THREE.PerspectiveCamera(params.fov, innerWidth / innerHeight, 1, 2000)
camera.position.set(0, 0, params.cameraZ)

const renderer = new THREE.WebGPURenderer({ antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
renderer.toneMapping = THREE.AgXToneMapping
renderer.setSize(innerWidth, innerHeight)
renderer.autoClear = false

document.body.appendChild(renderer.domElement)
renderer.domElement.style.position = 'fixed'
renderer.domElement.style.top = '0'
renderer.domElement.style.left = '0'
renderer.domElement.style.zIndex = '10'
renderer.domElement.style.pointerEvents = 'none'
await renderer.init()

const stats = new Stats({ trackGPU: true })
document.body.appendChild(stats.dom)
stats.init(renderer)
stats.dom.style.display = params.debug ? '' : 'none'

// ─── Geometry ─────────────────────────────────────────────────────────────────
const geoParams = { radius: 1, tube: 0.5, radialSegments: 32, tubularSegments: 64 }
let geometry = new THREE.TorusGeometry(
  geoParams.radius,
  geoParams.tube,
  geoParams.radialSegments,
  geoParams.tubularSegments,
)
geometry.computeTangents()

function rebuildGeometry() {
  geometry.dispose()
  geometry = new THREE.TorusGeometry(
    geoParams.radius,
    geoParams.tube,
    geoParams.radialSegments,
    geoParams.tubularSegments,
  )
  geometry.computeTangents()
  for (const mesh of meshes) mesh.geometry = geometry
}

// ─── Spiral Displacement ─────────────────────────────────────────────────
const spiralParams = {
  frequency: 5,
  twist: 5,
  amplitude: 0.02,
  speed: -0.5,
}

const uSpiralFrequency = uniform(spiralParams.frequency)
const uSpiralTwist = uniform(spiralParams.twist)
const uSpiralAmplitude = uniform(spiralParams.amplitude)
const uSpiralSpeed = uniform(spiralParams.speed)

const spiralDisplacement = Fn(() => {
  const u = uv().x.mul(float(Math.PI * 2)) // tubular angle
  const v = uv().y.mul(float(Math.PI * 2)) // radial angle
  const t = time.mul(uSpiralSpeed)

  // Spiral wave: bands that twist around the tube and flow over time
  const wave = sin(u.mul(uSpiralFrequency).add(v.mul(uSpiralTwist)).sub(t))

  // Displace along the normal
  return positionLocal.add(normalLocal.mul(wave.mul(uSpiralAmplitude)))
})()

// Analytical normal: perturb using the gradient of the displacement field
const spiralNormal = Fn(() => {
  const u = uv().x.mul(float(Math.PI * 2))
  const v = uv().y.mul(float(Math.PI * 2))
  const t = time.mul(uSpiralSpeed)

  const phase = u.mul(uSpiralFrequency).add(v.mul(uSpiralTwist)).sub(t)
  const grad = cos(phase).mul(uSpiralAmplitude)

  // Partial derivatives of displacement w.r.t. u and v
  const ddu = grad.mul(uSpiralFrequency).mul(float(Math.PI * 2))
  const ddv = grad.mul(uSpiralTwist).mul(float(Math.PI * 2))

  // Perturb normal using tangent-space gradient
  const perturbedLocal = normalLocal.sub(tangentLocal.mul(ddu)).sub(bitangentLocal.mul(ddv)).normalize()

  // Transform to view space (normalNode expects view-space normals)
  return modelNormalMatrix.mul(perturbedLocal).normalize()
})()

// ─── Materials (one per season) ───────────────────────────────────────────────
const springColors = { colorA: new THREE.Color(0x6a8a5a), colorB: new THREE.Color(0xa8d48a) }
const springColorA = uniform(color(springColors.colorA))
const springColorB = uniform(color(springColors.colorB))
const springMaterial = new THREE.MeshStandardNodeMaterial()
springMaterial.colorNode = Fn(() => {
  const t = time.mul(0.5)
  const p = positionWorld
  const wave = sin(p.x.mul(3).add(t)).mul(0.5).add(0.5)
  return mix(springColorA, springColorB, wave)
})()
springMaterial.roughness = 0.3
springMaterial.metalness = 0.1

const summerColors = { colorA: new THREE.Color(0xd4920a), colorB: new THREE.Color(0xf5d862) }
const summerColorA = uniform(color(summerColors.colorA))
const summerColorB = uniform(color(summerColors.colorB))
const summerMaterial = new THREE.MeshStandardNodeMaterial()
summerMaterial.colorNode = Fn(() => {
  const t = time.mul(0.3)
  const p = positionWorld
  const heat = sin(p.y.mul(4).add(t)).mul(0.5).add(0.5)
  return mix(summerColorA, summerColorB, heat)
})()
summerMaterial.roughness = 0.18
summerMaterial.metalness = 0.9

const autumnColors = { colorA: new THREE.Color(0xc45e2c), colorB: new THREE.Color(0xe8945a) }
const autumnColorA = uniform(color(autumnColors.colorA))
const autumnColorB = uniform(color(autumnColors.colorB))
const autumnMaterial = new THREE.MeshStandardNodeMaterial()
autumnMaterial.colorNode = Fn(() => {
  const t = time.mul(0.25)
  const p = positionWorld
  const blend = sin(p.x.mul(1.5).add(p.y.mul(2)).add(t))
    .mul(0.5)
    .add(0.5)
  return mix(autumnColorA, autumnColorB, blend)
})()
autumnMaterial.roughness = 0.9
autumnMaterial.metalness = 0.0

const winterMaterial = new THREE.MeshPhysicalNodeMaterial()
// winterMaterial.side = THREE.DoubleSide
winterMaterial.color.set(0x8cadca)
winterMaterial.roughness = 0.25
winterMaterial.metalness = 0
winterMaterial.transmission = 0.9
winterMaterial.ior = 1.37
winterMaterial.reflectivity = 0.58
winterMaterial.thickness = 0.6
winterMaterial.envMapIntensity = 1.7
// winterMaterial.clearcoat = 1
// winterMaterial.clearcoatRoughness = 0.27
// winterMaterial.iridescence = 0.5
// winterMaterial.iridescenceIOR = 1.01
winterMaterial.specularIntensity = 1.51
winterMaterial.specularColor.set(0x9cb1d3)
// Procedural FBM frost on roughness
const frostFrequency = uniform(20)
const frostLacunarity = uniform(3.7)
const frostDiminish = uniform(0.65)
const frostAmplitude = uniform(0.9)
const frostSpeed = uniform(-0.015)
const frostUv = uv().sub(vec2(float(0), time.mul(frostSpeed)))
const fbmNoise = mx_fractal_noise_float(frostUv.mul(frostFrequency), 3, frostLacunarity, frostDiminish)
  .mul(0.5)
  .add(0.5)
winterMaterial.roughnessNode = fbmNoise.mul(frostAmplitude)

// ─── Galaxy Material ──────────────────────────────────────────────────────────
// ─── Ethereal / Holographic Intro Material ────────────────────────────────────
const etherealMaterial = new THREE.MeshPhysicalNodeMaterial()
const ethColorBase = uniform(color(new THREE.Color(0xeee8f0)))
const ethColorBlue = uniform(color(new THREE.Color(0xb0c4e8)))
const ethColorLilac = uniform(color(new THREE.Color(0xd4b8e8)))
const ethColorRose = uniform(color(new THREE.Color(0xf0c8d8)))
const ethColorPearl = uniform(color(new THREE.Color(0xfaf6ff)))

etherealMaterial.colorNode = Fn(() => {
  const t = time.mul(0.2)
  const p = positionLocal
  const n = normalLocal

  // Angle-based iridescence using normal direction
  const viewShift = n.x.mul(2.0).add(n.y.mul(1.5)).add(t)
  const iridescentA = sin(viewShift).mul(0.5).add(0.5)
  const iridescentB = sin(viewShift.mul(1.3).add(2.1)).mul(0.5).add(0.5)
  const iridescentC = sin(viewShift.mul(0.7).add(4.2)).mul(0.5).add(0.5)

  // Slow swirl across surface
  const swirl = sin(p.x.mul(3.0).add(p.y.mul(2.0)).add(t.mul(0.5))).mul(0.5).add(0.5)

  // Layer opal colors
  const blueToLilac = mix(ethColorBlue, ethColorLilac, iridescentA)
  const roseBlend = mix(blueToLilac, ethColorRose, iridescentB.mul(0.4))
  const pearlBlend = mix(roseBlend, ethColorPearl, iridescentC.mul(0.3))

  // Mix with warm base
  return mix(ethColorBase, pearlBlend, swirl.mul(0.6).add(0.4))
})()

etherealMaterial.roughness = 0.12
etherealMaterial.metalness = 0.05
etherealMaterial.clearcoat = 1.0
etherealMaterial.clearcoatRoughness = 0.08
etherealMaterial.specularIntensity = 2.0
etherealMaterial.specularColor.set(0xeeddff)
etherealMaterial.reflectivity = 0.9
etherealMaterial.sheen = 0.8
etherealMaterial.sheenRoughness = 0.3
etherealMaterial.sheenColor.set(0xddccff)

etherealMaterial.emissiveNode = Fn(() => {
  const t = time.mul(0.2)
  const n = normalLocal

  // Subtle inner glow that shifts with viewing angle
  const glowShift = sin(n.x.mul(3.0).add(n.y.mul(2.0)).add(t)).mul(0.5).add(0.5)
  const glowColor = mix(color(0x201828), color(0x2a1838), glowShift)

  // Gentle breathing pulse
  const pulse = sin(t.mul(0.8)).mul(0.15).add(0.85)

  return glowColor.mul(pulse)
})()

// ─── Galaxy Material ──────────────────────────────────────────────────────────
const galaxyMaterial = new THREE.MeshPhysicalNodeMaterial()
const galaxyColorDeep = uniform(color(new THREE.Color(0x0b0020)))
const galaxyColorNebula = uniform(color(new THREE.Color(0x6a1b9a)))
const galaxyColorStars = uniform(color(new THREE.Color(0xc0d8ff)))
const galaxyColorPink = uniform(color(new THREE.Color(0xe040a0)))

galaxyMaterial.colorNode = Fn(() => {
  const t = time.mul(0.15)
  const p = positionWorld

  // Nebula swirl — large-scale color variation
  const swirl = sin(p.x.mul(2.0).add(p.y.mul(1.5)).add(t))
    .mul(0.5).add(0.5)

  // Secondary wave for pink/magenta streaks
  const streak = sin(p.y.mul(5.0).sub(p.x.mul(3.0)).add(t.mul(1.5)))
    .mul(0.5).add(0.5)

  // Star sparkle — high-frequency noise-like pattern
  const sparklePhase = p.x.mul(30.0).add(p.y.mul(27.0)).add(p.z.mul(33.0))
  const sparkle = sin(sparklePhase.add(t.mul(2.0)))
  const starMask = sparkle.mul(sparkle) // squared peaks (cheaper than x^4)
  const starThreshold = starMask.smoothstep(0.9, 1.0)

  // Base nebula: blend deep purple to nebula purple
  const nebulaBase = mix(galaxyColorDeep, galaxyColorNebula, swirl.mul(0.7))

  // Add pink streaks
  const withPink = mix(nebulaBase, galaxyColorPink, streak.mul(0.25))

  // Add star sparkles on top
  return mix(withPink, galaxyColorStars, starThreshold.mul(0.9))
})()

galaxyMaterial.roughness = 0.15
galaxyMaterial.metalness = 0.8
galaxyMaterial.specularIntensity = 2.0
galaxyMaterial.specularColor.set(0xaabbff)
galaxyMaterial.emissiveNode = Fn(() => {
  const t = time.mul(0.15)
  const p = positionWorld

  // Gentle nebula glow
  const glow = sin(p.x.mul(2.0).add(p.y.mul(1.5)).add(t))
    .mul(0.5).add(0.5)

  // Star sparkle emission
  const sparklePhase = p.x.mul(30.0).add(p.y.mul(27.0)).add(p.z.mul(33.0))
  const sparkle = sin(sparklePhase.add(t.mul(2.0)))
  const starMask = sparkle.mul(sparkle)
  const starThreshold = starMask.smoothstep(0.9, 1.0)

  const nebulaEmit = mix(color(0x1a0030), color(0x3a0060), glow).mul(0.4)
  const starEmit = color(0xddeeff).mul(starThreshold.mul(1.5))

  return nebulaEmit.add(starEmit)
})()

const materials = [etherealMaterial, springMaterial, summerMaterial, autumnMaterial, winterMaterial, galaxyMaterial]

// Apply spiral displacement and corrected normals to all materials
for (const mat of materials) {
  mat.positionNode = spiralDisplacement
  mat.normalNode = spiralNormal
}

// ─── Meshes (one per material, same geometry & transform) ─────────────────────
const meshes = materials.map((mat) => {
  const mesh = new THREE.Mesh(geometry, mat)
  scene.add(mesh)
  return mesh
})

// ─── Environment (RoomEnvironment IBL) ────────────────────────────────────────
const pmremGenerator = new THREE.PMREMGenerator(renderer)
scene.environment = pmremGenerator.fromScene(new RoomEnvironment()).texture

// ─── Three-point lighting (Key / Fill / Rim) ─────────────────────────────────
// Key light — warm, strongest, front-right
const keyLight = new THREE.SpotLight(0xfff0e0, 8, 30, Math.PI / 4, 0.5, 1)
keyLight.position.set(4, 3, 5)
scene.add(keyLight)

// Fill light — cool, softer, front-left
const fillLight = new THREE.SpotLight(0xd0e0ff, 3, 30, Math.PI / 3, 0.7, 1)
fillLight.position.set(-5, 1, 3)
scene.add(fillLight)

// Rim light — bright edge highlight from behind
const rimLight = new THREE.SpotLight(0xffffff, 6, 30, Math.PI / 4, 0.4, 1)
rimLight.position.set(0, 4, -5)
scene.add(rimLight)

// Precompile all materials
meshes.forEach((m, i) => { m.visible = true; m.name = `torus-${i}` })
await renderer.compileAsync(scene, camera)
meshes.forEach((m) => (m.visible = false))

// Dismiss loading screen — scene is ready
if (window.dismissLoader) window.dismissLoader()



// ─── Mouse Interaction ────────────────────────────────────────────────────────
const mouse = new THREE.Vector2(0, 0)
const targetRotation = new THREE.Vector2(0, 0)
const currentRotation = new THREE.Vector2(0, 0)

addEventListener('pointermove', (e) => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1
  mouse.y = -(e.clientY / innerHeight) * 2 + 1
})

// ─── Animation Loop ──────────────────────────────────────────────────────────
// ─── Cached scroll state (updated on scroll, read in render loop) ─────────
let cachedScrollY = window.scrollY
let cachedVH = window.innerHeight
let cachedVW = window.innerWidth

addEventListener('scroll', () => { cachedScrollY = window.scrollY }, { passive: true })

// ─── Render-skip optimisation: only re-render when something changes ──────
let prevScrollY = -1
let prevMouseX = -999
let prevMouseY = -999
let needsRender = true

// Mark dirty on scroll
addEventListener('scroll', () => { needsRender = true }, { passive: true })

let last = performance.now()

// Skip expensive GPU timestamp readback when not debugging
const debugMode = params.debug

renderer.setAnimationLoop(async () => {
  const now = performance.now()
  const delta = Math.min((now - last) / 1000, 0.1)
  last = now

  // Mouse-follow rotation
  targetRotation.x = -mouse.y * params.interactionMultiplier
  targetRotation.y = mouse.x * params.interactionMultiplier

  const lerpAlpha = 1 - Math.exp(-params.lerpSpeed * delta)
  currentRotation.x += (targetRotation.x - currentRotation.x) * lerpAlpha
  currentRotation.y += (targetRotation.y - currentRotation.y) * lerpAlpha

  for (const mesh of meshes) {
    mesh.rotation.set(currentRotation.x, currentRotation.y, 0)
  }

  // ── Scissor math (use cached values to avoid layout thrashing) ──
  const S = cachedScrollY
  const vh = cachedVH
  const vw = cachedVW
  const topSection = Math.min(Math.floor(S / vh), 5)
  const frac = Math.min(S / vh - topSection, 1)

  renderer.setScissorTest(false)
  renderer.clear(true, true, true)

  renderer.setScissorTest(true)

  for (const mesh of meshes) mesh.visible = false

  // Clamp to valid mesh indices
  const maxIdx = meshes.length - 1
  const clampedTop = Math.min(Math.max(topSection, 0), maxIdx)
  const nextIdx = Math.min(clampedTop + 1, maxIdx)
  const canSplit = frac >= 0.001 && clampedTop < maxIdx

  if (!canSplit) {
    // Single section — only render ONE mesh (no split overhead)
    renderer.setScissor(0, 0, vw, vh)
    renderer.setViewport(0, 0, vw, vh)
    meshes[clampedTop].visible = true
    renderer.render(scene, camera)
    meshes[clampedTop].visible = false
  } else {
    // Split: top portion = current section, bottom portion = next section
    const boundaryFromTop = vh * (1 - frac)

    const topH = Math.ceil(boundaryFromTop)
    renderer.setScissor(0, 0, vw, topH)
    renderer.setViewport(0, 0, vw, vh)
    meshes[clampedTop].visible = true
    renderer.render(scene, camera)
    meshes[clampedTop].visible = false

    const bottomH = Math.ceil(vh * frac)
    renderer.setScissor(0, vh - bottomH, vw, bottomH)
    renderer.setViewport(0, 0, vw, vh)
    meshes[nextIdx].visible = true
    renderer.render(scene, camera)
    meshes[nextIdx].visible = false
  }

  renderer.setScissorTest(false)

  // Only run stats in debug mode — skip expensive GPU timestamp readback otherwise
  if (debugMode) {
    stats.update()
    await renderer.resolveTimestampsAsync('render')
  }
})

// ─── Fixed UI ─────────────────────────────────────────────────────────────────
const indicatorsEl = document.getElementById('indicators')
const scrollHintEl = document.getElementById('scroll-hint')

// ─── Hamburger menu toggle ────────────────────────────────────────────────
const hamburgerEl = document.getElementById('hamburger')
const menuOverlayEl = document.getElementById('menu-overlay')
function toggleMenu(force) {
  const open = force !== undefined ? force : !menuOverlayEl.classList.contains('open')
  menuOverlayEl.classList.toggle('open', open)
  hamburgerEl.classList.toggle('open', open)
  hamburgerEl.setAttribute('aria-expanded', open ? 'true' : 'false')
}
hamburgerEl.addEventListener('click', () => toggleMenu())
menuOverlayEl.querySelectorAll('a').forEach((a) =>
  a.addEventListener('click', () => toggleMenu(false)),
)
addEventListener('keydown', (e) => {
  if (e.key === 'Escape') toggleMenu(false)
})

// Generate indicator dots
for (let i = 0; i < 6; i++) {
  const dot = document.createElement('div')
  dot.className = 'indicator-dot' + (i === 0 ? ' active' : '')
  dot.addEventListener('click', () => {
    window.scrollTo({ top: i * innerHeight, behavior: 'smooth' })
  })
  indicatorsEl.appendChild(dot)
}
const dots = indicatorsEl.querySelectorAll('.indicator-dot')

let prevUiSection = -1
addEventListener(
  'scroll',
  () => {
    const S = window.scrollY
    const vh = window.innerHeight

    // Scroll hint fade out
    if (scrollHintEl) {
      scrollHintEl.style.opacity = S > vh * 0.3 ? '0' : ''
    }

    // Active dot
    const activeSection = Math.min(Math.round(S / vh), 5)
    if (activeSection !== prevUiSection) {
      prevUiSection = activeSection
      dots.forEach((d, i) => d.classList.toggle('active', i === activeSection))

      // Switch nav & indicators to light text on dark galaxy section
      const isDark = activeSection === 5
      const nav = document.getElementById('main-nav')
      nav.style.color = isDark ? '#e0e0f0' : ''
      menuOverlayEl.style.background = isDark
        ? 'rgba(10, 10, 20, 0.92)'
        : ''
      menuOverlayEl.querySelectorAll('a').forEach((a) => {
        a.style.color = isDark ? '#e0e0f0' : ''
      })
      indicatorsEl.style.color = isDark ? '#e0e0f0' : ''
      dots.forEach((d) => {
        d.style.borderColor = isDark ? 'rgba(200,200,255,0.4)' : ''
      })
      if (scrollHintEl) scrollHintEl.style.color = isDark ? '#e0e0f0' : ''
    }
  },
  { passive: true },
)

// ─── Resize ──────────────────────────────────────────────────────────────────
addEventListener('resize', () => {
  cachedVH = innerHeight
  cachedVW = innerWidth
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
})
