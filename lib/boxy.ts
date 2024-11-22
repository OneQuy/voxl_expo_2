// lib/boxy.ts
// @ts-ignore
import * as THREE from 'three';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { BaseBodyPart, PartType, PartMeshGroup } from './boxy-parts';
// @ts-ignore
import { randInt } from 'three/src/math/MathUtils';

// Define MatProp struct to hold individual material properties
export interface MatProp {
  baseColor: THREE.Color;
  metallic: number;
  roughness: number;
  emissive: THREE.Color;
  emissiveIntensity: number;
}

// Define PaletteData struct to hold an array of MatProps
export interface PaletteMats {
  materials: MatProp[];
}

export class BoxyCharacter {
  private scene: THREE.Group | null = null;
  private sceneBodyParts: { [key in PartType]?: BaseBodyPart } = {};
  private activeParts: { [type in PartType]?: BaseBodyPart | null } = {
    [PartType.Body]: null,
    [PartType.Ear]: null,
    [PartType.Paw]: null,
  };
  public mixer: THREE.AnimationMixer | null = null;
  private animations: THREE.AnimationClip[] = [];
  private actions: Map<string, THREE.AnimationAction> = new Map();

  constructor(private loader: GLTFLoader) { }

  async loadBaseModel(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        // @ts-ignore
        (gltf) => {
          this.scene = gltf.scene;
          this.animations = gltf.animations;
          this.parseBodyParts();
          this.findPaletteMaterials('palette');
          if (this.scene && this.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.scene);
          }
          resolve();
        },
        undefined,
        // @ts-ignore
        (error) => reject(error)
      );
    });
  }

  private parseBodyParts(): void {
    if (!this.scene) {
      console.warn("Base model not loaded yet.");
      return;
    }

    const partKeywords: { [key in PartType]: string } = {
      [PartType.Body]: 'body',
      [PartType.Ear]: 'ear',
      [PartType.Paw]: 'paw',
    };

    for (const [partType, keyword] of Object.entries(partKeywords) as [PartType, string][]) {
      const bodyPart = new BaseBodyPart(this.loader, keyword, partType);
      bodyPart.loadPartFromScene(this.scene);
      this.sceneBodyParts[partType] = bodyPart;
      this.activeParts[partType] = bodyPart;
    }
  }

  public replaceBodyPart(newPart: BaseBodyPart): boolean {
    this.detach(newPart.getType());

    const scenePart = this.sceneBodyParts[newPart.getType()];
    if (!scenePart) return false;

    for (const newGroup of Object.values(newPart.getMeshGroups())) {
      const sceneGroup = this.findMatchedScenePartMeshGroup(newGroup, scenePart);
      if (sceneGroup) {
        for (const mesh of newGroup.meshes) {
          sceneGroup.rootNode.add(mesh);
        }
      }
    }
    this.activeParts[newPart.getType()] = newPart;
    return true;
  }

  // Animation controls
  public getAnimationNames(): string[] {
    return this.animations.map((clip) => clip.name);
  }

  public playAnimation(name: string): void {
    if (this.mixer) {
      this.mixer.stopAllAction();
      const clip = THREE.AnimationClip.findByName(this.animations, name);
      if (clip) {
        let action = this.actions.get(name);
        if (!action) {
          action = this.mixer.clipAction(clip);
          this.actions.set(name, action);
        }
        action.reset();
        action.play();
      } else {
        console.warn(`Animation ${name} not found`);
      }
    }
  }

  public pauseAnimation(): void {
    this.actions.forEach((action) => {
      action.paused = true;
    });
  }

  public resumeAnimation(): void {
    this.actions.forEach((action) => {
      action.paused = false;
    });
  }

  public getAnimationTime(): number {
    for (const action of this.actions.values()) {
      if (action.isRunning()) {
        return action.time;
      }
    }
    return 0;
  }

  public getAnimationDuration(name: string): number {
    const clip = THREE.AnimationClip.findByName(this.animations, name);
    return clip ? clip.duration : 0;
  }

  public setAnimationTime(time: number): void {
    for (const action of this.actions.values()) {
      if (action.isRunning()) {
        action.paused = true;
        action.time = time;
        action.play();
        break;
      }
    }
  }

  private extractScenePartKey(name: string) {
    return name.replace(/_\d+$/, '');
  }

  private detach(partType: PartType) {
    if (this.activeParts[partType]) {
      for (const group of Object.values(this.activeParts[partType]!.getMeshGroups())) {
        for (const mesh of group.meshes) {
          mesh.parent?.remove(mesh);
        }
      }
      this.activeParts[partType] = null;
    }
  }

  private findMatchedScenePartMeshGroup(group: PartMeshGroup, orgPart: BaseBodyPart): PartMeshGroup | null {
    const groupNodeName = group.rootNode.name;
    for (const orgGroup of Object.values(orgPart.getMeshGroups())) {
      const orgGroupKey = this.extractScenePartKey(orgGroup.rootNode.name);
      if (groupNodeName.startsWith(orgGroupKey)) {
        return orgGroup;
      }
    }
    return null;
  }

  getScene(): THREE.Group | null {
    return this.scene;
  }

  // Standard method to check if a material name is valid and parse the index
  private isValidPaletteMaterialName(name: string): { isValid: boolean, index: number | null } {
    return { isValid: true, index: randInt(0, 10) };
    // const match = name.match(/^palette_(\d+)$/); // Assuming the format is "palette_0", "palette_1", etc.
    // if (match) {
    //   return { isValid: true, index: parseInt(match[1], 10) }; // Return the parsed index if valid
    // }
    // return { isValid: false, index: null };
  }

  // Method to find palette materials from the scene using the validity check
  private findPaletteMaterials(keyword: string): THREE.MeshStandardMaterial[] {
    const paletteMaterials: THREE.MeshStandardMaterial[] = []; // Clear previous palette materials
    if (!this.scene) return [];
    // @ts-ignore
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const material = object.material;
        const { isValid, index } = this.isValidPaletteMaterialName(object.name);

        if (isValid && material instanceof THREE.MeshStandardMaterial) {
          paletteMaterials[index as number] = material; // Place material at its parsed index
        }
      }
    });
    return paletteMaterials;
  }

  // Method to apply palette data to the character's palette materials
  public applyPaletteMats(paletteData: PaletteMats): void {
    // Iterate through each material property in the paletteData
    const paletteMaterials = this.findPaletteMaterials('palette');
    paletteData.materials.forEach((matProp, index) => {
      const material = paletteMaterials[index];
      if (material) {
        material.color = matProp.baseColor;
        //material.metallic = matProp.metallic;
        material.roughness = matProp.roughness;
        material.emissive = matProp.emissive;
        material.emissiveIntensity = matProp.emissiveIntensity;
        material.needsUpdate = true;
      }
    });
  }

  // Method to return the number of palette materials
  public getPaletteMaterialCount(): number {
    const paletteMaterials = this.findPaletteMaterials('palette');
    return paletteMaterials.length;
  }
}