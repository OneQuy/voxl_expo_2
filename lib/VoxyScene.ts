import { Renderer } from 'expo-three';
// @ts-ignore
import * as THREE from 'three';
import { createGLTFLoader } from './loaders';
// @ts-ignore
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { BoxyCharacter } from './boxy';
import { BoxyController } from './boxy-controller';

/**
 * VoxyScene: A library class for managing a 3D scene.
 */
export class VoxyScene {
  private renderer: Renderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock: THREE.Clock;
  private boxyCharacter: BoxyCharacter | null = null;
  private boxyController: BoxyController | null = null;
  private animationId: number | null = null;

  constructor(private gl: WebGLRenderingContext) {
    this.renderer = new Renderer({ gl });
    // @ts-ignore 
    this.renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    // @ts-ignore
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Initialize scene
    this.scene = new THREE.Scene();

    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );
    this.camera.position.set(-5, 5, 10);

    // Initialize clock
    this.clock = new THREE.Clock();
  }

  /**
   * Loads assets and initializes the scene.
   */
  async initialize(): Promise<void> {
    await this.loadEnvironment();
    await this.loadCharacter();
    this.addLights();
    this.startAnimation();
  }

  /**
   * Loads the HDR environment map.
   */
  private async loadEnvironment(): Promise<void> {
    const hdrLoader = new RGBELoader();
    const hdrPath = require('../assets/envs/hdr/HDR_041_Path_Env.hdr');
    return new Promise((resolve, reject) => {
      hdrLoader.load(
        hdrPath,
        // @ts-ignore
        (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          this.scene.environment = texture;
          this.scene.background = texture;
          resolve();
        },
        undefined,
        // @ts-ignore
        (error) => {
          console.error('Failed to load HDR texture:', error);
          reject(error);
        }
      );
    });
  }

  /**
   * Loads the BoxyCharacter and its body parts.
   */
  private async loadCharacter(): Promise<void> {
    const loader = createGLTFLoader();
    this.boxyCharacter = new BoxyCharacter(loader);

    // Load base scene
    const baseScenePath = require('../assets/scenes/base_scene.glb');
    await this.boxyCharacter.loadBaseModel(baseScenePath);

    const boxyScene = this.boxyCharacter.getScene();
    if (boxyScene) {
      this.scene.add(boxyScene);
    }

    // Configure body parts
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

    this.boxyController = new BoxyController(loader, this.boxyCharacter, this.scene);
    await this.boxyController.loadBodyParts(bodyPartPaths);
  }

  /**
   * Adds lighting to the scene.
   */
  private addLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);
  }

  /**
   * Starts the animation loop.
   */
  private startAnimation(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);

      const delta = this.clock.getDelta();
      if (this.boxyCharacter?.mixer) {
        this.boxyCharacter.mixer.update(delta);
      }

      // @ts-ignore
      this.renderer.render(this.scene, this.camera);
      // @ts-ignore
      this.gl.endFrameEXP();
    };

    animate();
  }

  /**
   * Cleans up resources and stops the animation loop.
   */
  dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    // @ts-ignore
    this.renderer.dispose();
    this.scene.clear();
  }
}
