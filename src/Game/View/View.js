import * as THREE from 'three/webgpu'
import Game from "../Game.js";
import { OrbitControls  } from 'three/examples/jsm/controls/OrbitControls.js'; 

class View{
  constructor(){
    this.game = new Game()

    this.camera = new THREE.PerspectiveCamera(25, this.game.viewport.sizes.width / this.game.viewport.sizes.height, 0.1, 1000)
    this.camera.position.set(-10, 5, 10) // 10  10 20
    this.game.world.scene.add(this.camera)

    this.controls = new OrbitControls(this.camera, this.game.domElement)
    this.controls.enableDamping = true

    this.game.viewport.events.on('change', () => { this.resize() })
  }

  resize(){
    this.camera.aspect = this.game.viewport.sizes.width / this.game.viewport.sizes.height
    this.camera.updateProjectionMatrix()
  }

  update(){
      this.controls.update()
  }
}

export default View