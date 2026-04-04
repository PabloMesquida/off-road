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
    // this.setSecondLight()
  }

  setSunLight() {
    const light = new THREE.DirectionalLight('#ffe9cf', 2.5)
    light.castShadow = true

    // Tamaño del área donde se proyectan sombras
    light.shadow.camera.near = 0.5
    light.shadow.camera.far = 1000
    light.shadow.camera.left = -100
    light.shadow.camera.right = 100
    light.shadow.camera.top = 100
    light.shadow.camera.bottom = -100

    // Resolución de la sombra
    light.shadow.mapSize.set(1024 * 2, 1024 * 2)

    light.shadow.radius = 4.0

    // Ajuste fino de artefactos
    light.shadow.normalBias = 0.05

    // Posición y dirección
    light.position.set(5, 4, 2.5)
    light.target.position.set(0, 0,0)
    this.scene.add(light.target)

    // Añadir la luz
    this.scene.add(light)
    this.sunLight = light

    // Debug visual
    // const helper = new THREE.CameraHelper(light.shadow.camera)
    // this.scene.add(helper)
  }

  // setSecondLight() {
  //   const secondLight = new THREE.DirectionalLight('#ffffff', 1)
  //   secondLight.castShadow = false

  //   // Tamaño del área donde se proyectan sombras
  //   secondLight.shadow.camera.near = 0.5
  //   secondLight.shadow.camera.far = 1000
  //   secondLight.shadow.camera.left = -100
  //   secondLight.shadow.camera.right = 100
  //   secondLight.shadow.camera.top = 100
  //   secondLight.shadow.camera.bottom = -100

  //   // Resolución de la sombra
  //   secondLight.shadow.mapSize.set(1024, 1024)

  //   secondLight.shadow.radius = 4.0

  //   // Ajuste fino de artefactos
  //   secondLight.shadow.normalBias = 0.05

  //   // Posición y dirección
  //   secondLight.position.set(10, 10, 10)
  //   secondLight.target.position.set(0, 0,0)
  //   this.scene.add(secondLight.target)

  //   // Añadir la luz
  //   this.scene.add(secondLight)
  //   this.secondLight = secondLight

  //   // Debug visual
  //   // const helper = new THREE.CameraHelper(light.shadow.camera)
  //   // this.scene.add(helper)
  // }

  setEnvironmentMap() {
    this.environmentMap = {};

    this.environmentMap.texture = this.resources.items.environmentMapTexture;
    this.environmentMap.texture.colorSpace = THREE.SRGBColorSpace;

    this.scene.environment = this.environmentMap.texture;
  }

  setAmbientLight(){
    const ambientLight = new THREE.AmbientLight('#e2e7fe',0.25 )
    this.scene.add(ambientLight)

  }
}

export default Environment
