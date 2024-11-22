// lib/boxy-controller.ts

// @ts-ignore
import * as THREE from 'three';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { BaseBodyPart, PartType } from './boxy-parts';
import { BoxyCharacter, PaletteMats } from './boxy';

export interface BodyPartPaths {
  files: string[];
}

export class BoxyController {
  private loader: GLTFLoader;
  private character: BoxyCharacter;
  private bodyParts: { [type in PartType]?: { [name: string]: BaseBodyPart } } = {};

  constructor(loader: GLTFLoader, character: BoxyCharacter, scene: THREE.Scene) {
    this.loader = loader;
    this.character = character;
  }

  // Load all body parts based on the provided paths
  //   public async loadBodyParts(bodyPartPaths: { [type in PartType]: BodyPartPaths }): Promise<void> {
  //     for (const [type, paths] of Object.entries(bodyPartPaths) as [PartType, BodyPartPaths][]) {
  //       this.bodyParts[type] = {};

  //       for (const file of paths.files) {
  //         const partName = file.replace('.glb', '');
  //         const keyword = type.toLowerCase();

  //         const part = new BaseBodyPart(this.loader, keyword, type);
  //         await part.loadPartFromFile(`${paths.root}/${file}`);
  //         this.bodyParts[type]![partName] = part;
  //       }
  //     }
  //   }
  // // Load all body parts based on the provided paths
  public async loadBodyParts(bodyPartPaths: { [type in PartType]: BodyPartPaths }): Promise<void> {
    for (const [type, paths] of Object.entries(bodyPartPaths) as [PartType, BodyPartPaths][]) {
      this.bodyParts[type] = {};

      for (const filePath of paths.files) {
        const partName = filePath.split('/').pop()?.replace('.glb', '') || ''; // Extract the file name without extension
        const keyword = type.toLowerCase();

        const part = new BaseBodyPart(this.loader, keyword, type);
        await part.loadPartFromFile(filePath); // Use resolved require path directly
        this.bodyParts[type]![partName] = part;
      }
    }
  }

  // Get available parts for a specific type to display on the GUI
  public getAvailableParts(type: PartType): string[] {
    return Object.keys(this.bodyParts[type] || {});
  }

  // Swap the current body part with a new one based on the type and name
  public swapBodyPart(type: PartType, name: string): void {
    const newPart = this.bodyParts[type]?.[name];
    if (newPart) {
      this.character.replaceBodyPart(newPart);
    } else {
      console.warn(`No body part found for type: ${type} and name: ${name}`);
    }
  }

  // Animation Controls
  public getAnimationNames(): string[] {
    return this.character.getAnimationNames();
  }

  public playAnimation(name: string): void {
    this.character.playAnimation(name);
  }

  public pauseAnimation(): void {
    this.character.pauseAnimation();
  }

  public resumeAnimation(): void {
    this.character.resumeAnimation();
  }

  public getAnimationTime(): number {
    return this.character.getAnimationTime();
  }

  public getAnimationDuration(name: string): number {
    return this.character.getAnimationDuration(name);
  }

  public setAnimationTime(time: number): void {
    this.character.setAnimationTime(time);
  }

  // Palette Configuration
  public applyPaletteMats(paletteData: PaletteMats): void {
    this.character.applyPaletteMats(paletteData);
  }

  // Method to return the number of palette materials
  public getPaletteMaterialCount(): number {
    return this.character.getPaletteMaterialCount();
  }
}
