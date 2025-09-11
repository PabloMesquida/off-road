import * as THREE from 'three'
import Game from "../Game.js"

class World{
  constructor(){
    this.game = new Game()

    this.scene = new THREE.Scene()

    this.box = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshNormalMaterial()
    )
    this.scene.add(this.box)

    this.game.time.events.on('tick', () => { this.update() })
  }

  update(){
    this.box.rotation.y = this.game.time.elapsed * 0.0001  }
}

export default World