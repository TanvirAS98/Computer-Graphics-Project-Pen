import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Initialize the scene
const scene = new THREE.Scene();

// Camera setup
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 50, 150);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.setClearColor(0x000, 1); // White background
document.body.appendChild(renderer.domElement);

// OrbitControls for camera interaction
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = true;

// Add ambient light
const ambientLight = new THREE.AmbientLight(0x606060, 3); // Increased intensity
scene.add(ambientLight);

// Directional light for better illumination
const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(100, 100, 100);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Spotlights for dynamic lighting
const spotlight1 = new THREE.SpotLight(0xffffff, 2);
spotlight1.position.set(100, 100, 100);
spotlight1.castShadow = true;
spotlight1.angle = Math.PI / 4;
spotlight1.penumbra = 0.5;
scene.add(spotlight1);

// Add a target for the spotlight to focus on
const spotlightTarget = new THREE.Object3D();
spotlightTarget.position.set(0, 20, 0);
scene.add(spotlightTarget);
spotlight1.target = spotlightTarget;

// Texture loader
const textureLoader = new THREE.TextureLoader();
const floorTexture = textureLoader.load('./textures/bg.jpg');
const floorMaterial = new THREE.MeshStandardMaterial({ map: floorTexture });
const floorGeometry = new THREE.PlaneGeometry(400, 400);

// Create floor
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

// Variables for drawer animation
let doorLeft = null;
let doorRight = null;
let isDoorOpen = false;
let doorAnimationProgress = 0; // 0 = closed, 1 = fully open
let drawerOpenDistance = 0; // Distance to move the drawers
const maxOpenDistance = -7; // Adjust this value based on your model's scale

// Load the GLTF model
const loader = new GLTFLoader();
loader.load('./draa.glb', (gltf) => {
  const model = gltf.scene;
  model.scale.set(2, 2, 2);
  scene.add(model);

  // Load the drawer texture
  const drawerTexture = textureLoader.load('./textures/drawer.jpg');

  // Traverse through the model and find doors and apply texture
  model.traverse((child) => {
    console.log(child.name);
    if (child.isMesh) {
      child.material = new THREE.MeshStandardMaterial({ map: drawerTexture });
      child.material.needsUpdate = true;

      // Identify drawer meshes by their names
      if (child.name === 'Object007') {
        doorLeft = child;
      } else if (child.name === 'Object006') {
        doorRight = child;
      }
    }
  });
});

// Render loop
function animate() {
  requestAnimationFrame(animate);
  rotateSpotlight();
  controls.update();

  // Animate the drawers based on doorAnimationProgress
  if (doorLeft && doorRight) {
    drawerOpenDistance = maxOpenDistance * doorAnimationProgress; // Calculate open distance
    doorLeft.position.y = drawerOpenDistance; // Move left drawer up
    doorRight.position.y = drawerOpenDistance; // Move right drawer up
  }

  renderer.render(scene, camera);
}

// Spotlight rotation
let spotlightAngle = 0;
function rotateSpotlight() {
  spotlightAngle += 0.01;
  spotlight1.position.set(
    100 * Math.cos(spotlightAngle),
    100,
    100 * Math.sin(spotlightAngle)
  );
  spotlight1.lookAt(spotlightTarget.position);
}

// Handle mouse click to toggle drawers
document.addEventListener('mousedown', () => {
  if (!isDoorOpen) {
    // Open the drawers
    animateDoors(1); // 1 for fully open
  } else {
    // Close the drawers
    animateDoors(0); // 0 for fully closed
  }
  isDoorOpen = !isDoorOpen; // Toggle the state
});

// Animate drawer movement over time
function animateDoors(targetProgress) {
  const duration = 60; // Frames over which the animation will occur
  let frame = 0;

  function animateFrame() {
    frame++;
    doorAnimationProgress += (targetProgress - doorAnimationProgress) * 0.1;
    if (frame < duration) {
      requestAnimationFrame(animateFrame);
    }
  }
  animateFrame();
}

// Handle keyboard interaction for camera movement
document.addEventListener('keydown', (event) => {
  const moveDistance = 10;
  switch (event.key) {
    case 'ArrowUp':
      camera.position.z -= moveDistance;
      break;
    case 'ArrowDown':
      camera.position.z += moveDistance;
      break;
    case 'ArrowLeft':
      camera.position.x -= moveDistance;
      break;
    case 'ArrowRight':
      camera.position.x += moveDistance;
      break;
  }
});

animate();
