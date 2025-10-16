import * as THREE from 'three'
import Game from "../../Game.js"
import PaintMaterial from '../../Materials/Vehicle/PaintMaterial.js'
import SideLightMaterial from '../../Materials/Vehicle/SideLightMaterial.js'

class Chassis {
  constructor(position = {x:0,y:3,z:0}) {
    this.game = new Game()
    this.resources = this.game.resources
    
    this.resource = this.resources.items.carRastrojeroModel.scene

    this.physics = this.game.physics
    this.sizes = { x: 4.5, y: 1.25, z: 2}

    //this.rotation = { x:0 ,y:0, z: 0, w: 1 } 

    this.mesh = new THREE.Group()
    this.model = this.resource
    this.model.position.set(-1, -1, 0) 
    this.mesh.add(this.model)

    const carPaint = new PaintMaterial({ baseColor: 0x6aa0c4, rough: 0.6, metal: 0.2 });
    const sideLight = new SideLightMaterial()

    this.model.traverse((child) => {
        if (!child.isMesh) return
         child.castShadow = true
        if(child.material){
          console.log(child.material)
          console.log(`"${child.name}"`);
        }
        if (child.name.includes('Pintura')) {
           console.log('ok Pintura')
          child.material = carPaint;
        }
      if (child.name.includes("PlasticoNaranja")) {
          console.log('ok')
          child.material = sideLight;
        }
    })
 
    this.entity = this.physics.addEntity({
      type: 'dynamic',
      position,
      rotation: this.rotation,
      massProperties: {
        useAdditionalMassProperties: true,
         massValue: 12,
         com: { x: -0.5, y:-0.5, z: 0 }, // baja el COM 0.25m
        // principalInertia: { x: 2, y: 2, z: 2 },
        // inertiaFrame: { w: 1, x: 0, y: 0, z: 0 },
        // collidersContribute: false       // evita que los colliders sumen masa
      }, 
      colliders: [
        { shape: 'cuboid', parameters: [this.sizes.x * 0.5, this.sizes.y * 0.5, this.sizes.z * 0.5],
          offset: { x: 0, y: 0, z: 0 }, friction: 0.8 }
      ]
    }, this.mesh)
  }

 

  get body() {
    return this.entity.physical.body
  }
}

export default Chassis
   
//   this.mesh.traverse((child) => {
//     if (!child.isMesh) return;

//  const mats = Array.isArray(child.material) ? child.material : [child.material];
//    mats.forEach(mat => {
//         if (!mat) return;
//         // algunos materiales pueden no tener .color: comprobamos
//         if ('color' in mat && mat.color) {
//           mat.wireframe = true;
//           mat.color.set(0xff0000);   // o mat.color.set('red')
//           mat.needsUpdate = true;
//         } else {
//           // fallback: forzar reemplazo si el material no soporta color
//           console.warn('Material sin .color → se reemplazará con MeshBasicMaterial', mat);
//           // aquí no reasignamos todavía, lo dejamos para la sección 2 si querés
//         }
//       }); 
//   });