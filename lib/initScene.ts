// lib/initScene.ts
// @ts-ignore
import * as THREE from 'three';
import { BoxyCharacter } from './boxy';
import { BoxyController } from './boxy-controller';
import { createGLTFLoader } from './loaders';
// @ts-ignore
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let clock: THREE.Clock;

let boxyCharacter: BoxyCharacter;
let boxyController: BoxyController;


export async function initScene(): Promise<void> {
    scene = new THREE.Scene();

    // Load HDR environment
    const hdrLoader = new RGBELoader();
    const hdrPath = require('../assets/envs/hdr/HDR_041_Path_Env.hdr');
    // @ts-ignore
    hdrLoader.load(hdrPath, (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
        scene.background = texture;
    });

    // Initialize camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(-5, 5, 10);

    // Initialize renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.6;

    clock = new THREE.Clock();

    // Load BoxyCharacter
    const loader = createGLTFLoader();
    boxyCharacter = new BoxyCharacter(loader);

    const baseScenePath = require('../assets/scenes/base_scene.glb');
    await boxyCharacter.loadBaseModel(baseScenePath);

    const boxyScene = boxyCharacter.getScene();
    if (boxyScene) {
        scene.add(boxyScene);
    }

    const bodyPartPaths = {
        Body: {
            files: [
                require('../assets/scenes/Body/Body_0.glb'),
                require('../assets/scenes/Body/Body_1.glb'),
            ],
        },
        Ear: {
            files: [
                require('../assets/scenes/Ears/Ears_0.glb'),
                require('../assets/scenes/Ears/Ears_1.glb'),
            ],
        },
        Paw: {
            files: [
                require('../assets/scenes/Paws/Paws_0.glb'),
                require('../assets/scenes/Paws/Paws_1.glb'),
            ],
        },
    };

    boxyController = new BoxyController(loader, boxyCharacter, scene);
    await boxyController.loadBodyParts(bodyPartPaths);
}

export function animate(): void {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    if (boxyCharacter.mixer) {
        boxyCharacter.mixer.update(delta);
    }

    renderer.render(scene, camera);
}
