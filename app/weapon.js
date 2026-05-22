import * as THREE from "https://esm.sh/three@0.129.0";
import { OrbitControls } from "https://esm.sh/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://esm.sh/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

let objTorender = "sword";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

let object;
let controls;

// Rotation state
let isRotating = false;
let autoRotationY = Math.PI / 2;
let rotationTimeout = null;

const weaponFiles = {
    sword: "../3D/sword.glb",
    hellebaard: "../3D/Hellebaard.glb",
    morgenster: "../3D/Morgenster.glb"
};

const cameraDistance = {
    sword: 1,
    hellebaard: 1,
    morgenster: 1
};

const ambientIntensity = {
    sword: 0.6,
    hellebaard: 0.5,
    morgenster: 0.5
};

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const weaponContainer = document.getElementById("weapon");
renderer.setSize(weaponContainer.clientWidth, weaponContainer.clientHeight);
weaponContainer.appendChild(renderer.domElement);

camera.position.z = cameraDistance[objTorender] || 2;

const topLight = new THREE.DirectionalLight(0xffffff, 0.25);
topLight.castShadow = true;
topLight.shadow.mapSize.width = 2048 * 2;
topLight.shadow.mapSize.height = 2048 * 2;
topLight.shadow.camera.far = 1000 * 2;
scene.add(topLight);

const ambientLight = new THREE.AmbientLight(0xffffff, ambientIntensity[objTorender] || 0.5);
scene.add(ambientLight);

const frontLight = new THREE.DirectionalLight(0xffffff, 3);
frontLight.position.set(0, 0, 50);
scene.add(frontLight);

// OrbitControls volledig uitgeschakeld
controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = false;

const loader = new GLTFLoader();

function loadWeapon(weaponType) {
    const weaponFile = weaponFiles[weaponType] || weaponFiles.sword;

    loader.load(
        weaponFile,
        function (gltf) {
            object = gltf.scene;
            object.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material) {
                        child.material.side = THREE.FrontSide;
                    }
                }
            });
            scene.add(object);
        },
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            console.error(error);
        }
    );
}

loadWeapon(objTorender);

// Listen for weapon changes
window.addEventListener('weaponChange', (e) => {
    const newWeapon = e.detail.weapon;

    if (object) {
        scene.remove(object);
        object = null;
    }

    // Reset rotatie bij wapenwisseling
    isRotating = false;
    autoRotationY = Math.PI / 2;
    clearTimeout(rotationTimeout);

    ambientLight.intensity = ambientIntensity[newWeapon] || 0.5;
    camera.position.z = cameraDistance[newWeapon] || 2;

    loadWeapon(newWeapon);
});

// Listen for rotate gesture
window.addEventListener('gestureUpdate', (e) => {
    if (e.detail.rotating) {
        isRotating = true;

        clearTimeout(rotationTimeout);
        rotationTimeout = setTimeout(() => {
            isRotating = false;
        }, 1500);
    }
});

function animate() {
    requestAnimationFrame(animate);

    if (object) {
        if (isRotating) {
            autoRotationY += 0.02;
        }
        object.rotation.y = autoRotationY;
    }

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    const width = weaponContainer.clientWidth;
    const height = weaponContainer.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
});

animate();
