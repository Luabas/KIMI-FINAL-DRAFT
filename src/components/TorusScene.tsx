import { useEffect, useRef } from "react";
import * as THREE from "three";

interface TorusSceneProps {
  activeSection: number;
  scrollProgress: number;
}

// Per-section morph targets
const morphTargets = [
  {
    // Intro
    color1: new THREE.Color("#2E1A47"),
    color2: new THREE.Color("#5C3D7A"),
    speed: 0.3,
    amplitude: 0.0,
    morphProgress: 0.0,
    opacity: 0.85,
    radius: 3.5,
    tube: 1.0,
  },
  {
    // Spring - Audit
    color1: new THREE.Color("#4a7c59"),
    color2: new THREE.Color("#87b091"),
    speed: 0.5,
    amplitude: 0.15,
    morphProgress: 0.3,
    opacity: 0.9,
    radius: 3.2,
    tube: 1.3,
  },
  {
    // Summer - Liberate
    color1: new THREE.Color("#d4a373"),
    color2: new THREE.Color("#e9c46a"),
    speed: 0.8,
    amplitude: 0.25,
    morphProgress: 0.6,
    opacity: 0.95,
    radius: 3.0,
    tube: 0.8,
  },
  {
    // Autumn - Integrate
    color1: new THREE.Color("#8b4513"),
    color2: new THREE.Color("#cd853f"),
    speed: 0.4,
    amplitude: 0.1,
    morphProgress: 0.2,
    opacity: 0.88,
    radius: 3.4,
    tube: 1.1,
  },
  {
    // Winter - Iterate
    color1: new THREE.Color("#b0c4de"),
    color2: new THREE.Color("#e0e0e0"),
    speed: 0.2,
    amplitude: 0.05,
    morphProgress: 0.0,
    opacity: 0.8,
    radius: 2.8,
    tube: 1.4,
  },
  {
    // Galaxy - Actualize
    color1: new THREE.Color("#1a0a2e"),
    color2: new THREE.Color("#4a1a6a"),
    speed: 1.2,
    amplitude: 0.35,
    morphProgress: 0.8,
    opacity: 1.0,
    radius: 3.6,
    tube: 1.2,
  },
];

const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  uniform float uTime;
  uniform float uSpeed;
  uniform float uAmplitude;
  uniform float uMorphProgress;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);

    vec3 pos = position;
    vec3 targetPos = position + normal * (sin(position.y * 4.0 + uTime) * uAmplitude);
    pos = mix(pos, targetPos, uMorphProgress);
    pos += normal * sin(pos.y * 2.0 + uTime * uSpeed) * 0.1;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    vPosition = pos;
  }
`;

const fragmentShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;

  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uOpacity;

  void main() {
    float t = smoothstep(-1.0, 1.0, vPosition.y);
    vec3 color = mix(uColor1, uColor2, t);
    gl_FragColor = vec4(color, uOpacity);
  }
`;

export default function TorusScene({ activeSection, scrollProgress }: TorusSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const geometryRef = useRef<THREE.TorusKnotGeometry | null>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 12);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Geometry
    const isMobile = window.innerWidth <= 768;
    const tubularSegments = isMobile ? 100 : 150;
    const radialSegments = isMobile ? 12 : 16;
    const geometry = new THREE.TorusKnotGeometry(
      3.5,
      1.0,
      tubularSegments,
      radialSegments,
      2,
      3
    );
    geometryRef.current = geometry;

    // Material
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: 0.3 },
        uAmplitude: { value: 0.0 },
        uMorphProgress: { value: 0.0 },
        uColor1: { value: new THREE.Color("#2E1A47") },
        uColor2: { value: new THREE.Color("#5C3D7A") },
        uOpacity: { value: 0.85 },
      },
      transparent: true,
      side: THREE.DoubleSide,
    });
    materialRef.current = material;

    // Mesh
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    meshRef.current = mesh;

    // Animation loop
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);

      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      material.uniforms.uTime.value = elapsed;

      // Rotate mesh slowly
      mesh.rotation.y = elapsed * 0.1;
      mesh.rotation.x = elapsed * 0.05;

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update morph targets based on scroll
  useEffect(() => {
    const material = materialRef.current;
    const mesh = meshRef.current;
    const geometry = geometryRef.current;
    if (!material || !mesh || !geometry) return;

    const currentIdx = Math.min(activeSection, morphTargets.length - 1);
    const nextIdx = Math.min(currentIdx + 1, morphTargets.length - 1);

    const current = morphTargets[currentIdx];
    const next = morphTargets[nextIdx];
    const p = scrollProgress;

    // Interpolate colors
    const c1 = current.color1.clone().lerp(next.color1, p);
    const c2 = current.color2.clone().lerp(next.color2, p);
    material.uniforms.uColor1.value.copy(c1);
    material.uniforms.uColor2.value.copy(c2);

    // Interpolate uniforms
    material.uniforms.uSpeed.value =
      current.speed + (next.speed - current.speed) * p;
    material.uniforms.uAmplitude.value =
      current.amplitude + (next.amplitude - current.amplitude) * p;
    material.uniforms.uMorphProgress.value =
      current.morphProgress + (next.morphProgress - current.morphProgress) * p;
    material.uniforms.uOpacity.value =
      current.opacity + (next.opacity - current.opacity) * p;

    // Interpolate geometry parameters (visual scale instead of recreation)
    const targetRadius = current.radius + (next.radius - current.radius) * p;
    const targetTube = current.tube + (next.tube - current.tube) * p;
    const scaleRatio = targetRadius / 3.5;
    mesh.scale.setScalar(scaleRatio);
  }, [activeSection, scrollProgress]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[1] pointer-events-none"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
