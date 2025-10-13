import * as THREE from 'three'
import Game from "../../Game"

class Environment{
  constructor(scene){
    this.game = new Game()
    this.scene = scene

    this.setSunLight()
  }

  setSunLight(){
        this.sunLight = new THREE.DirectionalLight('#ffe9cf', 1)
        this.sunLight.castShadow = true
        this.sunLight.shadow.camera.far = 15
        this.sunLight.shadow.mapSize.set(1024, 1024)
        this.sunLight.shadow.normalBias = 0.05
        this.sunLight.position.set(-1, 1, 1)
        this.scene.add(this.sunLight)
  }
  
}

export default Environment