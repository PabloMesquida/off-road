import * as THREE from 'three'
import Game from '../../../core/Game'

class Environment {
  constructor(scene) {
    this.game = new Game()
    this.resources = this.game.resources
    this.scene = scene

    this.setSunLight()
    this.setEnvironmentMap()
    this.setAmbientLight()
  }

  setSunLight() {
    const light = new THREE.DirectionalLight('#ffe9cf', 1)
    light.castShadow = true

    // Tamaño del área donde se proyectan sombras
    light.shadow.camera.near = 0.5
    light.shadow.camera.far = 1000
    light.shadow.camera.left = -100
    light.shadow.camera.right = 100
    light.shadow.camera.top = 100
    light.shadow.camera.bottom = -100

    // Resolución de la sombra
    light.shadow.mapSize.set(1024, 1024)

    light.shadow.radius = 4.0

    // Ajuste fino de artefactos
    light.shadow.normalBias = 0.05

    // Posición y dirección
    light.position.set(0, 15, 0.5)
    light.target.position.set(0, 0,0)
    this.scene.add(light.target)

    // Añadir la luz
    this.scene.add(light)
     this.sunLight = light

    // Debug visual
    // const helper = new THREE.CameraHelper(light.shadow.camera)
    // this.scene.add(helper)
  }

  setEnvironmentMap() {
    this.environmentMap = {};

    this.environmentMap.texture = this.resources.items.environmentMapTexture;
    this.environmentMap.texture.colorSpace = THREE.SRGBColorSpace;

    this.scene.environment = this.environmentMap.texture;
  }

  setAmbientLight(){
    const ambientLight = new THREE.AmbientLight('#f6ffcf',0.2)
    this.scene.add(ambientLight)

  }
}

export default Environment
