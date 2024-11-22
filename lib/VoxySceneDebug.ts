import { Renderer } from 'expo-three';
// @ts-ignore
import * as THREE from 'three';

/**
 * VoxyScene: A library class for managing a 3D scene.
 */
export class VoxyScene {
  private renderer: Renderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private cube: THREE.Mesh;
  private light: THREE.DirectionalLight;
  private animationId: number | null = null;

  constructor(private gl: WebGLRenderingContext) {
    this.renderer = new Renderer({ gl });
    // @ts-ignore
    this.renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

    // Initialize the scene
    this.scene = new THREE.Scene();

    // Set up the camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;

    // Create a rotating cube
    this.cube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0x00ff00 })
    );
    this.scene.add(this.cube);

    // Add a directional light
    this.light = new THREE.DirectionalLight(0xffffff, 1);
    this.light.position.set(1, 1, 1).normalize();
    this.scene.add(this.light);
  }

  /**
   * Initialize the scene and start the animation loop.
   */
  initialize() {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);

      // Update cube rotation
      this.cube.rotation.x += 0.01;
      this.cube.rotation.y += 0.01;

      // Render the scene
      // @ts-ignore
      this.renderer.render(this.scene, this.camera);
      // @ts-ignore
      this.gl.endFrameEXP();
    };

    animate();
  }

  /**
   * Dispose of resources and stop the animation loop.
   */
  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    // Dispose of renderer and clear the scene
    // @ts-ignore
    this.renderer.dispose();
    this.scene.clear();
  }
}
