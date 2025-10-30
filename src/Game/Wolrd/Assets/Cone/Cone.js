import * as THREE from "three";
import Game from "../../../Game";

class Cone {
  constructor(scene) {
    this.game = new Game();
    this.scene = scene;

    this.resources = this.game.resources;
    this.resource = this.resources.items.coneModel.scene;

    this.model = this.resource;
    this.model.position.set(-3, 0.1, 1.5);
    this.scene.add(this.model);

    this.createMaterials();
    this.applyMaterials();
  }

  createMaterials() {
    this.materials = {
      base: new THREE.MeshStandardMaterial({
        color: 0xad4800,
        metalness: 0,
        roughness: 0.9,
      }),
      cone: new THREE.MeshStandardMaterial({
        color: 0xad4800,
        metalness: 0,
        roughness: 0.9,
      }),
      stripe: new THREE.MeshStandardMaterial({
        color: 0xf5e8df,
        metalness: 0,
        roughness: 0.9,
      }),
      default: new THREE.MeshStandardMaterial({
        color: 0xaaaaaa,
      }),
    };
  }

  applyMaterials() {
    this.model.traverse((child) => {
      if (!child.isMesh) return;

      let mat;
      switch (child.name) {
        case "Base":
          mat = this.materials.base;
          break;
        case "Cono":
          mat = this.materials.cone;
          break;
        case "ConoFranja":
          mat = this.materials.stripe;
          break;
        default:
          mat = this.materials.default;
      }

      // ✅ Reutiliza materiales (no creas nuevos cada vez)
      child.material = mat;

      // ✅ Sombra solo si es necesario
      child.castShadow = true;
      child.receiveShadow = true;
    });
  }
}

export default Cone;
