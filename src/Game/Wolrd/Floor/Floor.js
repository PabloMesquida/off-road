import * as THREE from 'three/webgpu'
import PolishedConcreteMaterial from '../../Materials/PolishedConcreteMaterial.js'
import { GridNodeMaterial } from '../../Materials/GridNodeMaterial.js'
import Game from '../../Game.js'

class Floor{
  constructor(scene, physics, { x = 20, y = 0.2, z = 20 } = {}) {
    this.game = new Game()
    this.scene = scene
    this.physics = physics
    this.size = { x, y, z }
    

    this.PARAMS = {
      preset: 'dark',
      opacity: 0.04,
      width: 20,
      offset: 10,
      stripeSize: 1.5
    }

    this.pane = this.game.pane
    
    this.setModel()
    this.setPhysics()

    this.initTweakpane()
  }

  initTweakpane() {
    if (!this.pane) return

    // Creamos una carpeta dentro del panel global
    this.folder = this.pane.addFolder({ title: 'Floor', expanded: false })

    const gridFolder = this.folder.addFolder({ title: 'Grid' })
    const limitsFolder = this.folder.addFolder({ title: 'Limits' })

    gridFolder.addBinding(this.PARAMS, 'preset', {
      options: {
        Dark: 'dark',
        Contrast: 'contrast',
        Default: 'default',
        Blueprint: 'blueprint',
        Retro: 'retro',
        Neon: 'neon',
        Funky: 'funky'
      }
    })
    gridFolder.addBinding(this.PARAMS, 'opacity', { step: 0.01, min: 0, max: 0.1 })

    limitsFolder.addBinding(this.PARAMS, 'width', { step: 1, min: 0, max: 50 })
    limitsFolder.addBinding(this.PARAMS, 'offset', { step: 1, min: 0, max: 50 })
    limitsFolder.addBinding(this.PARAMS, 'stripeSize', { step: 0.1, min: 0.5, max: 2.5 })

    // Escuchar cambios globalmente
    this.folder.on('change', () => {
      this.updateGridPreset()
    })
  }

  setModel(){
    const { x, y, z } = this.size
    const geometry = new THREE.BoxGeometry(x, y, z)

    const material = new PolishedConcreteMaterial()// new FloorMaterial({ color: '#9b9e89' })  // 
  
    // const gridMaterial = GridNodeMaterial.fromPreset('blueprint')
    const floorMesh = new THREE.Mesh(geometry, material)

    this.mesh = floorMesh

    const subFloorGeometry = new THREE.PlaneGeometry(x, z);

    this.subFloorMaterial = GridNodeMaterial.fromPreset(this.PARAMS.preset);
    this.subFloorMaterial.gridSize = new THREE.Vector2(x, z)
    this.subFloorMaterial.borderColor = new THREE.Color('#ffff00')
    this.subFloorMaterial.borderWidth = this.PARAMS.width
    this.subFloorMaterial.borderOffset = this.PARAMS.offset
    this.subFloorMaterial.stripeSize = this.PARAMS.stripeSize
    this.subFloorMaterial.opacity = this.PARAMS.opacity

    const subFloorMesh = new THREE.Mesh(subFloorGeometry, this.subFloorMaterial)
    subFloorGeometry.rotateX(-Math.PI / 2)
    subFloorMesh.position.set(0, 0.12, 0)
    
    this.floorGroup = new THREE.Object3D()
    floorMesh.position.set(0, 0, 0)
    floorMesh.castShadow = true;
    floorMesh.receiveShadow = true;
    this.floorGroup.add(subFloorMesh)
    this.floorGroup.add(floorMesh)

    this.scene.add(this.floorGroup)
  }

  setPhysics(){
    const { x, y, z } = this.size
    this.physics.addEntity({
      type: 'kinematic',
      position: { x:0, y:0, z:0},
      colliders: [ { 
        shape: 'cuboid', 
        parameters: [x * .5, y * .5, z * .5],
        restitution: 0.05,   
        friction: 0.5
      }]
    }, this.floorGroup)   
  }

  updateGridPreset() {
    // Crear un nuevo material basado en el nuevo preset
    const newMaterial = GridNodeMaterial.fromPreset(this.PARAMS.preset)

    // Conservar algunas propiedades personalizadas
    newMaterial.gridSize = this.subFloorMaterial.gridSize
    newMaterial.borderColor = this.subFloorMaterial.borderColor
    newMaterial.borderWidth = this.PARAMS.width
    newMaterial.borderOffset = this.PARAMS.offset
    newMaterial.stripeSize = this.PARAMS.stripeSize
    newMaterial.opacity =  this.PARAMS.opacity   

    // Reemplazar el material en la malla
    const subFloorMesh = this.floorGroup.children.find(m => m.material === this.subFloorMaterial)
    if (subFloorMesh) subFloorMesh.material = newMaterial

    // Liberar el material anterior
    this.subFloorMaterial.dispose()

    // Actualizar referencia
    this.subFloorMaterial = newMaterial
  }

  getLimit() {
    const halfSize = this.size.x * 0.5;
    // Calcula el límite interior según tus parámetros visuales
    return halfSize - this.PARAMS.offset - this.PARAMS.width;
  }

 

}

export default Floor