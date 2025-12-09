import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { PointerLockControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/PointerLockControls.js';

let camera, scene, renderer, controls;
const objects = [];
let raycaster;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

let weaponElement; // Define globally, assign later

// 1. WAIT FOR DOM TO LOAD
document.addEventListener('DOMContentLoaded', () => {
    // Assign DOM elements now that they definitely exist
    weaponElement = document.getElementById('weapon');
    
    // Check if critical elements exist before starting
    if (!document.getElementById('instructions')) {
        console.error("Error: Could not find element with id 'instructions' in your HTML.");
        return;
    }

    init();
    animate();
});

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);
    scene.fog = new THREE.Fog(0x111111, 0, 750);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.y = 10;

    const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
    light.position.set(0.5, 1, 0.75);
    scene.add(light);

    controls = new PointerLockControls(camera, document.body);

    // Get elements safely
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

    raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, - 1, 0), 0, 10);

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    floorGeometry.rotateX(- Math.PI / 2);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    scene.add(floor);

    // Walls
    const boxGeometry = new THREE.BoxGeometry(20, 40, 20);
    const boxMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x884400, 
        roughness: 0.7,
        metalness: 0.2
    }); 

    for (let i = 0; i < 200; i++) {
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.position.x = Math.floor(Math.random() * 20 - 10) * 40;
        box.position.y = 20;
        box.position.z = Math.floor(Math.random() * 20 - 10) * 40;

        if (Math.abs(box.position.x) < 50 && Math.abs(box.position.z) < 50) continue;

        scene.add(box);
        objects.push(box);
    }

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function shoot() {
    if (weaponElement) {
        weaponElement.classList.add('firing');
        setTimeout(() => {
            weaponElement.classList.remove('firing');
        }, 100);
    }

    const shootRaycaster = new THREE.Raycaster();
    shootRaycaster.setFromCamera( new THREE.Vector2(0, 0), camera );

    const intersects = shootRaycaster.intersectObjects(objects);

    if (intersects.length > 0) {
        intersects[0].object.material = intersects[0].object.material.clone();
        intersects[0].object.material.color.set(0xff0000);
        intersects[0].object.material.emissive.set(0xaa0000);
    }
}

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();

    if (controls && controls.isLocked === true) {
        const delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
    }

    prevTime = time;

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}
