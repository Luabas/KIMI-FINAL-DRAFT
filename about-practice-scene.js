import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

(function initPractice() {
  const container = document.getElementById('practice-canvas')
  if (!container) return

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(container.offsetWidth || 320, container.offsetHeight || 400)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
  renderer.outputColorSpace = THREE.SRGBColorSpace
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

  const camera = new THREE.PerspectiveCamera(40, (container.offsetWidth || 320) / (container.offsetHeight || 400), 0.1, 100)
  camera.position.set(0, 0, 5.8)

  scene.add(new THREE.AmbientLight(0xfff5e8, 0.4))
  const key = new THREE.DirectionalLight(0xfff0e0, 1.5)
  key.position.set(3, 4, 2)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xe8e8f8, 0.6)
  fill.position.set(-2, 1, 5)
  scene.add(fill)

  // Torus Knot — warm ceramic cream (35% smaller: 1.0 * 0.65 = 0.65)
  const geometry = new THREE.TorusKnotGeometry(0.65, 0.23, 160, 32, 2, 3)
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xe8ddd0,
    roughness: 0.25,
    metalness: 0.0,
    transmission: 0.55,
    thickness: 1.8,
    ior: 1.52,
    clearcoat: 0.2,
    clearcoatRoughness: 0.2,
    envMapIntensity: 0.5,
    specularIntensity: 0.8,
  })

  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  // Mouse-reactive rotation (like pricing hero)
  let mx = 0, my = 0
  const targetRot = new THREE.Vector2(0, 0)
  const currentRot = new THREE.Vector2(0, 0)

  document.addEventListener('mousemove', (e) => {
    mx = (e.clientX / window.innerWidth - 0.5) * 2
    my = (e.clientY / window.innerHeight - 0.5) * 2
  })

  new ResizeObserver(() => {
    const w = container.offsetWidth, h = container.offsetHeight
    if (w && h) { camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h) }
  }).observe(container)

  const clock = new THREE.Clock()
  let last = performance.now()

  function animate() {
    requestAnimationFrame(animate)

    const t = clock.getElapsedTime()
    const now = performance.now()
    const delta = Math.min((now - last) / 1000, 0.1)
    last = now

    // Organic breathing (subtle float — no spin)
    mesh.position.y = Math.sin(t * 0.15) * 0.06

    // Mouse-reactive rotation with smooth damping (like pricing hero)
    targetRot.x = -my * 0.12
    targetRot.y = mx * 0.12

    const lerpAlpha = 1 - Math.exp(-3 * delta)
    currentRot.x += (targetRot.x - currentRot.x) * lerpAlpha
    currentRot.y += (targetRot.y - currentRot.y) * lerpAlpha

    mesh.rotation.set(currentRot.x, currentRot.y, 0)

    renderer.render(scene, camera)
  }
  animate()
})()
