import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { PointerLockControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/PointerLockControls.js';

// --- Global Variables ---
let camera, scene, renderer, controls;
const objects = []; // For collision detection
let raycaster;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

const weaponElement = document.getElementById('weapon');

// --- Initialization ---
init();
animate();

function init() {
    // 1. Scene Setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111); // Dark background
    scene.fog = new THREE.Fog(0x111111, 0, 750); // DOOM-like darkness distance

    // 2. Camera Setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.y = 10;

    // 3. Lighting
    const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
    light.position.set(0.5, 1, 0.75);
    scene.add(light);

    // Point light to act as "player torch" or muzzle flash logic could go here
    const pointLight = new THREE.PointLight(0xff0000, 0.5, 100);
    camera.add(pointLight); // Light follows camera
    scene.add(camera);

    // 4. Controls (PointerLock)
    controls = new PointerLockControls(camera, document.body);

    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');

    instructions.addEventListener('click', function () {
        controls.lock();
    });

    controls.addEventListener('lock', function () {
        instructions.style.display = 'none';
        blocker.style.display = 'none';
    });

    controls.addEventListener('unlock', function () {
        blocker.style.display = 'flex';
        instructions.style.display = 'block';
    });

    scene.add(controls.getObject());

    // 5. Input Handling
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

    const onMouseDown = function () {
        if (controls.isLocked) {
            shoot();
        }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousedown', onMouseDown);

    // 6. Raycaster for Interaction/Shooting
    raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, - 1, 0), 0, 10);

    // 7. World Generation (Simple Floor & Walls)
    
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    floorGeometry.rotateX(- Math.PI / 2);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    scene.add(floor);

    // Walls (Procedural-ish random boxes)
    const boxGeometry = new THREE.BoxGeometry(20, 40, 20); // Width, Height, Depth
    const boxMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x884400, // Brownish wall
        roughness: 0.7,
        metalness: 0.2
    }); 

    for (let i = 0; i < 200; i++) {
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        
        // Random positions
        box.position.x = Math.floor(Math.random() * 20 - 10) * 40;
        box.position.y = 20; // Half height
        box.position.z = Math.floor(Math.random() * 20 - 10) * 40;

        // Keep center clear for spawn
        if (Math.abs(box.position.x) < 50 && Math.abs(box.position.z) < 50) continue;

        scene.add(box);
        objects.push(box);
    }

    // 8. Renderer Setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Handle Resize
    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Shooting Logic
function shoot() {
    // Visual Recoil
    weaponElement.classList.add('firing');
    setTimeout(() => {
        weaponElement.classList.remove('firing');
    }, 100);

    // Raycast hit detection
    // Cast a ray from center of screen
    const shootRaycaster = new THREE.Raycaster();
    shootRaycaster.setFromCamera( new THREE.Vector2(0, 0), camera );

    const intersects = shootRaycaster.intersectObjects(objects);

    if (intersects.length > 0) {
        // Change color of hit object to red
        intersects[0].object.material = intersects[0].object.material.clone(); // Clone material to not affect others
        intersects[0].object.material.color.set(0xff0000);
        intersects[0].object.material.emissive.set(0xaa0000);
        
        // Remove object after delay (simulating death)
        // setTimeout(() => {
        //     scene.remove(intersects[0].object);
        // }, 200);
    }
}

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();

    if (controls.isLocked === true) {
        const delta = (time - prevTime) / 1000;

        // Friction / Decceleration
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        // Direction calculation
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize(); // ensure consistent speed in all directions

        // Acceleration
        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

        // Apply movement
        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
    }

    prevTime = time;

    renderer.render(scene, camera);
}