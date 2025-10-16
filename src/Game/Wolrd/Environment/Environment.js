import * as THREE from 'three'
import Game from '../../Game'

class Environment {
  constructor(scene) {
    this.game = new Game()
    this.resources = this.game.resources
    this.scene = scene

     this.setSunLight()
    this.setEnvironmentMap()
  }

  setSunLight() {
    const light = new THREE.DirectionalLight('#ffe9cf', 0.5)
    light.castShadow = true

    // Tamaño del área donde se proyectan sombras
    light.shadow.camera.near = 0.5
    light.shadow.camera.far = 30
    light.shadow.camera.left = -10
    light.shadow.camera.right = 10
    light.shadow.camera.top = 10
    light.shadow.camera.bottom = -10

    // Resolución de la sombra
    light.shadow.mapSize.set(512, 512)

    // Ajuste fino de artefactos
    light.shadow.normalBias = 0.05

    // Posición y dirección
    light.position.set(-10, 15, 10)
    light.target.position.set(0, 0, 0)
    this.scene.add(light.target)

    // Añadir la luz
    this.scene.add(light)
    this.sunLight = light

    // 🔍 Debug visual
    const helper = new THREE.CameraHelper(light.shadow.camera)
    this.scene.add(helper)
  }

  setEnvironmentMap() {
    this.environmentMap = {}
    this.environmentMap.intensity = 0.4
    this.environmentMap.texture = this.resources.items.environmentMapTexture
    this.environmentMap.texture.colorSpace = THREE.SRGBColorSpace
    this.scene.environment = this.environmentMap.texture
  }
}

export default Environment
