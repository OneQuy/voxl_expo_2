// lib/boxy-parts.ts
// @ts-ignore
import * as THREE from 'three';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export enum PartType {
  Body = 'Body',
  Ear = 'Ear',
  Paw = 'Paw',
}

export interface PartMeshGroup {
  rootNode: THREE.Object3D;
  meshes: THREE.Mesh[];
}

export class BaseBodyPart {
  protected loader: GLTFLoader;
  protected meshGroups: { [name: string]: PartMeshGroup } = {};
  private keyword: string;
  private pattern: RegExp;
  private partType: PartType;

  constructor(loader: GLTFLoader, keyword: string, partType: PartType) {
    this.loader = loader;
    this.keyword = keyword; // Keyword used for filtering
    this.partType = partType; // Type of the part
    this.pattern = new RegExp(`^(model|shape)_${this.keyword}`);
  }

  public getType(): PartType {
    return this.partType;
  }

  // Load the body part from a .glb file
  async loadPartFromFile(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        // @ts-ignore
        (gltf) => {
          this.parseScene(gltf.scene);
          resolve();
        },
        undefined,
        // @ts-ignore
        (error) => reject(error)
      );
    });
  }

  public getKeyword(): string {
    return this.keyword;
  }

  public loadPartFromScene(scene: THREE.Object3D): void {
    this.parseScene(scene);
  }

  private isValidName(name: string): boolean {
    return this.pattern.test(name);
  }

  private findPartMeshes(node: THREE.Object3D): THREE.Mesh[] {
    const meshes: THREE.Mesh[] = [];

    // @ts-ignore
    node.traverse((child) => {
      if (child instanceof THREE.Mesh && child.parent?.name.includes(this.keyword)) {
        meshes.push(child);
      }
    });
    return meshes;
  }

  private parseScene(scene: THREE.Object3D): void {
    const meshes = this.findPartMeshes(scene);
    for (const mesh of meshes) {
      const parent = mesh.parent!;
      if (this.isValidName(parent.name)) {
        if (!this.meshGroups[parent.name]) {
          this.meshGroups[parent.name] = {
            rootNode: parent,
            meshes: [],
          };
        }
        this.meshGroups[parent.name].meshes.push(mesh);
      }
    }
  }

  getMeshGroups(): PartMeshGroup[] {
    return Object.values(this.meshGroups);
  }
}
