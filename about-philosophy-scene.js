import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

(function initPhilosophy() {
  const container = document.getElementById('philosophy-canvas')
  if (!container) return

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(container.offsetWidth || 320, container.offsetHeight || 400)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1
  renderer.outputColorSpace = THREE.SRGBColorSpace
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

  const camera = new THREE.PerspectiveCamera(38, (container.offsetWidth || 320) / (container.offsetHeight || 400), 0.1, 100)
  camera.position.set(0, 0, 5.8)

  scene.add(new THREE.AmbientLight(0xf8f0e8, 0.3))
  const key = new THREE.DirectionalLight(0xfff0e0, 2.0)
  key.position.set(2, 5, 3)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xe0e8f0, 1.0)
  fill.position.set(-4, 0, 4)
  scene.add(fill)
  const rim = new THREE.DirectionalLight(0xffffff, 0.6)
  rim.position.set(0, -3, -4)
  scene.add(rim)

  // Torus Knot — warm bronze-gold (35% smaller: 1.0 * 0.65 = 0.65)
  const geometry = new THREE.TorusKnotGeometry(0.65, 0.22, 160, 32, 3, 4)
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xc8b89a,
    roughness: 0.12,
    metalness: 0.08,
    transmission: 0.35,
    thickness: 2.5,
    ior: 1.65,
    clearcoat: 0.5,
    clearcoatRoughness: 0.08,
    envMapIntensity: 0.8,
    specularIntensity: 1.0,
    specularColor: new THREE.Color(0xfff8f0),
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
    mesh.position.y = Math.sin(t * 0.12) * 0.05

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
