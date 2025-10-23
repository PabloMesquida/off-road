import * as THREE from 'three/webgpu'
import Game from "../Game.js"
import { OrbitControls  } from 'three/examples/jsm/controls/OrbitControls.js'

class View{
  constructor(){
    this.game = new Game()

    this.camera = new THREE.PerspectiveCamera(25, this.game.viewport.sizes.width / this.game.viewport.sizes.height, 0.1, 1000)
    this.camera.position.set(-10, 5, 10)

    this.game.world.scene.add(this.camera)

    this.controls = new OrbitControls(this.camera, this.game.domElement)
    this.controls.enableDamping = true
    this.controls.enabled = true 

    this.offset = new THREE.Vector3(20, 10, 20)
    this.lerpSpeed = 3.5

    this.game.viewport.events.on('change', () => { this.resize() })
  }

  resize(){
    this.camera.aspect = this.game.viewport.sizes.width / this.game.viewport.sizes.height
    this.camera.updateProjectionMatrix()
  }

 update(dt) {
  const vehicle = this.game.world.vehicle;
  if (!vehicle || !vehicle.chassis) return;

  // const body = vehicle.chassis.body;
  // const pos = body.translation();
  // const carPos = new THREE.Vector3(pos.x, pos.y, pos.z);

  // const desiredCamPos = carPos.clone().add(this.offset);
  // this.camera.position.lerp(desiredCamPos, 1 - Math.exp(-this.lerpSpeed * dt));

  // const lookAtPos = carPos.clone().add(new THREE.Vector3(0, 1.0, 0));
  // this.camera.lookAt(lookAtPos);
  this.controls.update(dt)
}
}

export default View