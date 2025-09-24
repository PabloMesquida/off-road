import * as THREE from 'three/webgpu'
import Game from "../../Game"

class Vehicle{
  constructor(scene){
    this.game = new Game()
    this.scene = scene

    this.chasis = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({color: 'orange', wireframe: true})
    )
  }


  setModel(){
    this.scene.add(this.chasis)
  }
}

export default Vehicle