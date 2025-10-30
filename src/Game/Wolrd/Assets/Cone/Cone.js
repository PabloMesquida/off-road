import * as THREE from "three";
import Game from "../../../Game";

class Cone {
  constructor(scene, position = {x:-3,y:0.1,z:1.5}) {
    this.game = new Game()
    this.physics = this.game.physics
    this.scene = scene

    this.resources = this.game.resources
    this.resource = this.resources.items.coneModel.scene

    this.model = this.resource

    this.group = new THREE.Group()
    this.group.add(this.model)
    this.scene.add(this.group)

    this.createMaterials()
    this.applyMaterials()
    this.createPhysics(position)
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
      if (!child.isMesh) return

      let mat
      switch (child.name) {
        case "Base":
          mat = this.materials.base
          break
        case "Cono":
          mat = this.materials.cone
          break
        case "ConoFranja":
          mat = this.materials.stripe
          break
        default:
          mat = this.materials.default
      }

      child.material = mat

      child.castShadow = true
      child.receiveShadow = true
    });
  }

   createPhysics(position) {
    const box = new THREE.Box3().setFromObject(this.model)
    const size = new THREE.Vector3()
    box.getSize(size)

    this.entity = this.physics.addEntity({
      type: 'dynamic',
      position,
      massProperties: {
        useAdditionalMassProperties: true,
        massValue: 1,
        com: { x: 0, y: -size.y / 2, z: 0 },
      },
      colliders: [
        {
          shape: 'cuboid',
          parameters: [size.x * 0.5, size.y * 0.5, size.z * 0.5],
          friction: 0.8,
        },
      ],
    }, this.group)

    this.model.position.y -= size.y / 2;
  }
}

export default Cone
