import * as THREE from 'three'
import Game from "../../Game.js"
import PaintMaterial from '../../Materials/Vehicle/PaintMaterial.js'
import LightMaterial from '../../Materials/Vehicle/LightMaterial.js'
import MetalMaterial from '../../Materials/Vehicle/MetalMaterial.js'
import GlassMaterial from '../../Materials/Vehicle/GlassMaterial.js'
import WoodMaterial from '../../Materials/Vehicle/WoodMaterial.js'

class Chassis {
  constructor(position = {x:0,y:3,z:0}) {
    this.game = new Game()

    this.resources = this.game.resources
    this.resource = this.resources.items.carRastrojeroModel.scene

    this.physics = this.game.physics
    this.sizes = { x: 4.5, y: 1.25, z: 2}

    this.mesh = new THREE.Group()
    this.model = this.resource
    this.model.position.set(-1, -1, 0) 
    this.mesh.add(this.model)

    this.materials = {
      carPaint: new PaintMaterial({ baseColor: 0x6aa0c4, rough: 0.6, metal: 0.2 }),
      metal: new MetalMaterial({ baseColor: 0x8a8a8a, rough: 0.3, metal: 0.6 }),
      sideLight: new LightMaterial({ baseColor: 0xc95908, intensity: 0, maxIntensity: 5.0 }),
      brakeLight: new LightMaterial({ baseColor: 0xa10000, intensity: 0, maxIntensity: 15.0  }),
      reverseLight: new LightMaterial({ baseColor: 0xeddaab, intensity: 0, maxIntensity: 1.5 }),
      frontLight: new LightMaterial({ baseColor: 0xc2c2ac, intensity: 0, maxIntensity: 1.8 }),
      chassis: new PaintMaterial({ baseColor: 0x232323, rough: 0.7, metal: 1.0 }),
      glass: new GlassMaterial({ baseColor: 0x405a6b, rough: 0.25, transmission: 0.95, metal: 0}),
      tire: new PaintMaterial({ baseColor: 0x181818, rough: 0.8, metal: 0 }),
      wood: new WoodMaterial()
    }

    this.applyMaterials()

    this.createPhysics(position)
  }

  applyMaterials() {
    this.model.traverse((child) => {
      if (!child.isMesh) return
      child.castShadow = true

      const { carPaint, metal, sideLight, brakeLight, reverseLight, frontLight, chassis, glass, tire, wood } = this.materials

      console.log(child.name)

      if (child.name.includes('Pintura')) child.material = carPaint
      else if (child.name.includes('PlasticoNaranja')) child.material = sideLight
      else if (child.name.includes('LucesFreno')) child.material = brakeLight
      else if (child.name.includes('LucesReversa')) child.material = reverseLight
      else if (child.name.includes('Metal')) child.material = metal
      else if (child.name.includes('VidrioLuces')) child.material = frontLight
      else if (child.name.includes('Cube005')) child.material = chassis
      else if (child.name.includes('Vidrio')) child.material = glass
      else if (child.name.includes('Goma')) child.material = tire
      else if (child.name.includes('Madera')) child.material = wood
    })
  }

  createPhysics(position) {
    this.sizes = { x: 4.5, y: 1.25, z: 2 }

    this.entity = this.physics.addEntity({
      type: 'dynamic',
      position,
      massProperties: {
        useAdditionalMassProperties: true,
        massValue: 12,
        com: { x: -0.5, y: -0.5, z: 0 },
      },
      colliders: [
        {
          shape: 'cuboid',
          parameters: [
            this.sizes.x * 0.5,
            this.sizes.y * 0.5,
            this.sizes.z * 0.5,
          ],
          friction: 0.8,
        },
      ],
    }, this.mesh)
  }
 

  get body() {
    return this.entity.physical.body
  }
}

export default Chassis
   
  // principalInertia: { x: 2, y: 2, z: 2 },
  // inertiaFrame: { w: 1, x: 0, y: 0, z: 0 },
  // collidersContribute: false       // evita que los colliders sumen masa