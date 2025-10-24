import * as THREE from 'three'
import Game from '../../Game'

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
    light.shadow.camera.left = -20
    light.shadow.camera.right = 20
    light.shadow.camera.top = 20
    light.shadow.camera.bottom = -20

    // Resolución de la sombra
    light.shadow.mapSize.set(1024, 1024)

    light.shadow.radius = 8.0

    // Ajuste fino de artefactos
    light.shadow.normalBias = 0.02

    // Posición y dirección
    light.position.set(-10, 10, 15)
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
  // this.scene.background = this.environmentMap.texture; // opcional, si quieres que se vea de fondo

    // Intensidad global del environment map
   const intensity = 10; // ajusta entre 0 (sin reflejo) y 2 (muy fuerte)

/*     this.scene.traverse((child) => {
      if (child.isMesh && child.material) {
        const mat = child.material;
        if ('envMapIntensity' in mat) {
          mat.envMapIntensity = intensity;
          mat.needsUpdate = true;
        }
      }
    }); */
  }

  setAmbientLight(){
    const ambientLight = new THREE.AmbientLight('#f6ffcf',0.2)
    this.scene.add(ambientLight)

  }
}

export default Environment
