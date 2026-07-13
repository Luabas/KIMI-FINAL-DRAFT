import { useState, useEffect, useRef } from "react";
import * as THREE from "three";

// ========== SCENE.JS ==========
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 12;

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
document.body.appendChild(renderer.domElement);
renderer.domElement.style.position = "fixed";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";
renderer.domElement.style.width = "100%";
renderer.domElement.style.height = "100%";
renderer.domElement.style.zIndex = "1";
renderer.domElement.style.pointerEvents = "none";

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

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

const uniforms = {
  uTime: { value: 0 },
  uSpeed: { value: 0.3 },
  uAmplitude: { value: 0.0 },
  uMorphProgress: { value: 0.0 },
  uColor1: { value: new THREE.Color("#2E1A47") },
  uColor2: { value: new THREE.Color("#5C3D7A") },
  uOpacity: { value: 0.85 },
};

const shaderMaterial = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms,
  transparent: true,
  side: THREE.DoubleSide,
});

let torusKnot = new THREE.Mesh(
  new THREE.TorusKnotGeometry(3.5, 1.0, 150, 16, 2, 3),
  shaderMaterial
);
scene.add(torusKnot);

// Section morph targets
const morphTargets = [
  { radius: 3.5, tube: 1.0, color1: "#2E1A47", color2: "#5C3D7A", speed: 0.3, amplitude: 0.0, morphProgress: 0.0, opacity: 0.85 },
  { radius: 3.2, tube: 1.3, color1: "#4a7c59", color2: "#87b091", speed: 0.5, amplitude: 0.15, morphProgress: 0.3, opacity: 0.9 },
  { radius: 3.0, tube: 0.8, color1: "#d4a373", color2: "#e9c46a", speed: 0.8, amplitude: 0.25, morphProgress: 0.6, opacity: 0.95 },
  { radius: 3.4, tube: 1.1, color1: "#8b4513", color2: "#cd853f", speed: 0.4, amplitude: 0.1, morphProgress: 0.2, opacity: 0.88 },
  { radius: 2.8, tube: 1.4, color1: "#b0c4de", color2: "#e0e0e0", speed: 0.2, amplitude: 0.05, morphProgress: 0.0, opacity: 0.8 },
  { radius: 3.6, tube: 1.2, color1: "#1a0a2e", color2: "#4a1a6a", speed: 1.2, amplitude: 0.35, morphProgress: 0.8, opacity: 1.0 },
];

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function updateTorus(scrollProgress: number) {
  const idx = Math.floor(scrollProgress);
  const nextIdx = Math.min(idx + 1, morphTargets.length - 1);
  const p = scrollProgress - idx;

  const current = morphTargets[idx] || morphTargets[0];
  const next = morphTargets[nextIdx];

  uniforms.uSpeed.value = lerp(current.speed, next.speed, p);
  uniforms.uAmplitude.value = lerp(current.amplitude, next.amplitude, p);
  uniforms.uMorphProgress.value = lerp(current.morphProgress, next.morphProgress, p);
  uniforms.uOpacity.value = lerp(current.opacity, next.opacity, p);

  const c1 = new THREE.Color(current.color1);
  const c2 = new THREE.Color(next.color1);
  uniforms.uColor1.value.lerpColors(c1, c2, p);

  const c3 = new THREE.Color(current.color2);
  const c4 = new THREE.Color(next.color2);
  uniforms.uColor2.value.lerpColors(c3, c4, p);

  const newRadius = lerp(current.radius, next.radius, p);
  const newTube = lerp(current.tube, next.tube, p);
  torusKnot.scale.setScalar(newRadius / 3.5);
}

// Clock
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();
  uniforms.uTime.value = elapsed;
  torusKnot.rotation.y = elapsed * 0.1;
  torusKnot.rotation.x = elapsed * 0.05;
  renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ========== SCROLL LOGIC ==========
let currentSection = 0;
let scrollProgress = 0;

function onScroll() {
  const vh = window.innerHeight;
  scrollProgress = window.scrollY / vh;
  currentSection = Math.round(scrollProgress);
  updateTorus(scrollProgress);

  // Update nav color
  const nav = document.getElementById("main-nav");
  if (nav) {
    if (currentSection >= 5) {
      nav.style.color = "#e0e0f0";
    } else {
      nav.style.color = "#1a1a1a";
    }
  }

  // Update dots
  document.querySelectorAll(".indicator-dot").forEach((dot, i) => {
    dot.classList.toggle("active", i === currentSection);
    if (currentSection >= 5) {
      (dot as HTMLElement).style.borderColor = "rgba(200,200,255,0.3)";
    } else {
      (dot as HTMLElement).style.borderColor = "rgba(0,0,0,0.3)";
    }
  });

  // Hide scroll hint
  const hint = document.getElementById("scroll-hint");
  if (hint && window.scrollY > 50) {
    hint.style.opacity = "0";
  }
}

window.addEventListener("scroll", onScroll, { passive: true });

// ========== INDICATORS ==========
const indicators = document.getElementById("indicators");
if (indicators) {
  for (let i = 0; i < 6; i++) {
    const dot = document.createElement("div");
    dot.className = "indicator-dot";
    if (i === 0) dot.classList.add("active");
    dot.addEventListener("click", () => {
      window.scrollTo({ top: i * window.innerHeight, behavior: "smooth" });
    });
    indicators.appendChild(dot);
  }
}

// ========== HAMBURGER ==========
const hamburger = document.getElementById("hamburger");
const menuOverlay = document.getElementById("menu-overlay");

if (hamburger && menuOverlay) {
  hamburger.addEventListener("click", () => {
    const isOpen = menuOverlay.classList.contains("open");
    menuOverlay.classList.toggle("open");
    hamburger.classList.toggle("open");
    hamburger.setAttribute("aria-expanded", isOpen ? "false" : "true");
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      menuOverlay.classList.remove("open");
      hamburger.classList.remove("open");
      hamburger.setAttribute("aria-expanded", "false");
    }
  });

  menuOverlay.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menuOverlay.classList.remove("open");
      hamburger.classList.remove("open");
      hamburger.setAttribute("aria-expanded", "false");
    });
  });
}
