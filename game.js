// Now this works because of the importmap in HTML
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// --- INIT ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x333333); // Dark gray "Doom-like" fog
scene.fog = new THREE.Fog(0x333333, 0, 50);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- LIGHTING ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 0.5);
pointLight.position.set(5, 10, 5);
scene.add(pointLight);

// --- LEVEL (Simple Floor & Walls) ---
// Floor
const floorGeo = new THREE.PlaneGeometry(100, 100);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Random Cubes (Obstacles)
const boxGeo = new THREE.BoxGeometry(2, 4, 2);
const boxMat = new THREE.MeshStandardMaterial({ color: 0x880000 }); // Doom Red

for(let i=0; i<20; i++) {
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.x = (Math.random() - 0.5) * 50;
    box.position.z = (Math.random() - 0.5) * 50;
    box.position.y = 2; // Sit on floor
    scene.add(box);
}

// --- CONTROLS (FPS) ---
const controls = new PointerLockControls(camera, document.body);

// Click to capture mouse
document.addEventListener('click', () => {
    controls.lock();
});

scene.add(controls.getObject());
camera.position.y = 1.6; // Eye height

// --- MOVEMENT LOGIC ---
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
const prevTime = performance.now();

const onKeyDown = function (event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': moveForward = true; break;
        case 'ArrowLeft':
        case 'KeyA': moveLeft = true; break;
        case 'ArrowDown':
        case 'KeyS': moveBackward = true; break;
        case 'ArrowRight':
        case 'KeyD': moveRight = true; break;
    }
};

const onKeyUp = function (event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': moveForward = false; break;
        case 'ArrowLeft':
        case 'KeyA': moveLeft = false; break;
        case 'ArrowDown':
        case 'KeyS': moveBackward = false; break;
        case 'ArrowRight':
        case 'KeyD': moveRight = false; break;
    }
};

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

// --- ANIMATION LOOP ---
let lastTime = performance.now();

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - lastTime) / 1000;
    lastTime = time;

    if (controls.isLocked) {
        // Friction
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        // Direction
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize(); // Ensure consistent speed in all directions

        if (moveForward || moveBackward) velocity.z -= direction.z * 100.0 * delta; // Speed
        if (moveLeft || moveRight) velocity.x -= direction.x * 100.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
    }

    renderer.render(scene, camera);
}

animate();

// Handle Window Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
