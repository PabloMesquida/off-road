import * as THREE from 'three'
import Game from "../../Game"

class Environment{
  constructor(scene){
    this.game = new Game()
    this.resources = this.game.resources
    this.scene = scene

    this.setSunLight()
    this.setEnvironmentMap()
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

  setEnvironmentMap(){
    this.environmentMap = {}
    this.environmentMap.intensity = 0.4
    this.environmentMap.texture = this.resources.items.environmentMapTexture
    this.environmentMap.texture.colorSpace = THREE.SRGBColorSpace
    this.scene.environment = this.environmentMap.texture

    this.environmentMap.updateMaterials = () =>{
      this.scene.traverse((child) => {
        if(child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial){
          child.material.envMap = this.environmentMap.texture
          child.material.envMapIntensity = this.environmentMap.intensity
          child.material.needsUpdate = true
        }
      })
    }
    
    this.environmentMap.updateMaterials()
  }

}

export default Environment