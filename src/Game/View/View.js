import * as THREE from 'three/webgpu'
import Game from "../Game.js";

class View{
  constructor(){
    this.game = new Game()

    this.camera = new THREE.PerspectiveCamera(25, this.game.viewport.sizes.width / this.game.viewport.sizes.height, 0.1, 1000)
    this.camera.position.set(10, 10, 20)
    this.camera.lookAt(0,0,0)
    this.game.world.scene.add(this.camera)

    this.game.viewport.events.on('change', () => { this.resize() })
  }

  resize(){
    this.camera.aspect = this.game.viewport.sizes.width / this.game.viewport.sizes.height
    this.camera.updateProjectionMatrix()
  }
}

export default View