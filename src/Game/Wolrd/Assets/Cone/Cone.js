import * as THREE from 'three'
import Game from "../../../Game"

class Cone{
  constructor(scene){
    this.game = new Game()
    this.scene = scene

    this.resources = this.game.resources
    this.resource = this.resources.items.coneModel.scene

    this.model = this.resource
    this.model.position.set(0,0.1,5)
    this.scene.add(this.model)

    this.applyMaterials()
  }

   applyMaterials() {
    this.model.traverse((child) => {
      console.log(child)
         if (child.isMesh) {
        switch (child.name) {
          case "Base":
            child.material = new THREE.MeshStandardMaterial({
              color: 0xad4800,
              metalness: 0,
              roughness: 0.9,
            });
            break;

          case "Cono":
            child.material = new THREE.MeshStandardMaterial({
              color: 0xad4800, 
              metalness: 0,
              roughness: 0.9,
            });
            break;

                case "ConoFranja":
            child.material = new THREE.MeshStandardMaterial({
              color: 0xffffff, 
              metalness: 0,
              roughness: 0.9,
            });
            break;

          default:
            child.material = new THREE.MeshStandardMaterial({
              color: 0xaaaaaa, // gris por defecto
            });
            break;
        }

        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

   }
}

export default Cone
