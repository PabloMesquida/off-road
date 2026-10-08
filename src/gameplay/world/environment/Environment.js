import * as THREE from 'three'
import Game from '../../../core/Game'

class Environment {
  constructor(scene, { terrainSize = { x: 160, z: 160 } } = {}) {
    this.game = new Game()
    this.resources = this.game.resources
    this.scene = scene
    this.terrainSize = terrainSize

    this.setSunLight()
    this.setEnvironmentMap()
    this.setAmbientLight()
    // this.setSecondLight()
  }

  setSunLight() {
    const light = new THREE.DirectionalLight('#ffe9cf', 2.5)
    light.castShadow = true

    // La luz direccional ilumina según la dirección position → target, pero su cámara de sombras
    // se ubica en position: hay que alejarla para que todo el terreno quede delante del plano near.
    // Misma dirección que antes (5, 4, 2.5): la iluminación no cambia.
    const direction = new THREE.Vector3(5, 4, 2.5).normalize()
    const distance = 150

    // Frustum que cubre el terreno completo desde cualquier ángulo (semidiagonal + margen
    // para objetos altos como carteles o la camioneta en el aire)
    const halfDiagonal = Math.hypot(this.terrainSize.x, this.terrainSize.z) * 0.5
    const extent = halfDiagonal + 5

    light.shadow.camera.near = distance - extent
    light.shadow.camera.far = distance + extent
    light.shadow.camera.left = -extent
    light.shadow.camera.right = extent
    light.shadow.camera.top = extent
    light.shadow.camera.bottom = -extent

    // Resolución de la sombra
    light.shadow.mapSize.set(1024 * 2, 1024 * 2)

    light.shadow.radius = 4.0

    // Ajuste fino de artefactos
    light.shadow.normalBias = 0.05

    // Posición y dirección
    light.position.copy(direction).multiplyScalar(distance)
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
