import * as THREE from 'three/webgpu'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 100)
camera.position.z = 4.5

const renderer = new THREE.WebGPURenderer({ antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
renderer.toneMapping = THREE.AgXToneMapping
renderer.setSize(innerWidth, innerHeight)

// Insert canvas before first script in head (works even before body exists)
const firstScript = document.querySelector('script')
if (firstScript && firstScript.parentNode) {
  firstScript.parentNode.insertBefore(renderer.domElement, firstScript)
} else {
  document.documentElement.appendChild(renderer.domElement)
}
renderer.domElement.style.position = 'fixed'
renderer.domElement.style.top = '0'
renderer.domElement.style.left = '0'
renderer.domElement.style.width = '100%'
renderer.domElement.style.height = '100%'
renderer.domElement.style.zIndex = '10'
renderer.domElement.style.pointerEvents = 'none'

const geometry = new THREE.TorusKnotGeometry(1.4, 0.25, 200, 32, 3, 5)

const colorA = new THREE.Color(0.94, 0.93, 0.89)
const colorB = new THREE.Color(0.094, 0.093, 0.089)

const environment = new RoomEnvironment()
const pmremGenerator = new THREE.PMREMGenerator(renderer)
const renderTarget = pmremGenerator.fromScene(environment)

const material = new THREE.MeshPhysicalMaterial({
  color: colorA,
  metalness: 0,
  roughness: 0,
  ior: 1.5,
  transmission: 1,
  specularIntensity: 1,
  envMap: renderTarget.texture,
  envMapIntensity: 1.0,
})

const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

await renderer.init()
console.log('WebGPU initialized, renderer:', renderer)
if (window.dismissLoader) window.dismissLoader()

function animate() {
  requestAnimationFrame(animate)
  mesh.rotation.y += 0.005
  renderer.render(scene, camera)
}
animate()

// Debug: add visible indicator that scene is running
const debugDiv = document.createElement('div')
debugDiv.style.cssText = 'position:fixed;top:10px;left:10px;z-index:9999;background:lime;padding:10px;font-size:12px;font-family:monospace;'
debugDiv.textContent = 'SCENE RUNNING'
document.body.appendChild(debugDiv)

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
})
