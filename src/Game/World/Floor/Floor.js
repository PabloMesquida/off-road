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

    this.debugStartZoneMesh = null

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

    this.loadFromLocal()
    this.applyParamsToMaterial()
  }

  initTweakpane() {
    if (!this.pane) return

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
      this.saveToLocal() 
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
    subFloorMesh.position.set(0, 0.11, 0)
    
    this.floorGroup = new THREE.Object3D()
    floorMesh.position.set(0, 0, 0)
    floorMesh.castShadow = true;
    floorMesh.receiveShadow = true;
    this.floorGroup.add(subFloorMesh)
    this.floorGroup.add(floorMesh)

    this.createDebugStartZone()

    this.scene.add(this.floorGroup)
  }

  setPhysics(){
    const { x, y, z } = this.size
    this.physics.addEntity({
      type: 'fixed',
      position: { x:0, y:0, z:0},
      colliders: [ { 
        shape: 'cuboid', 
        parameters: [x * .5, y * .5, z * .5],
        restitution: 0, // 0.05,   
        friction: 0.8
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

  getStartZoneBounds() {
      // Tamaño de la zona prohibida (ancho y profundidad)
      const startZoneWidth = 8; 
      const startZoneDepth = 5; 

      // Centro del plano (0,0)
      const xMin = -startZoneWidth / 2;
      const xMax = startZoneWidth / 2;
      const zMin = -startZoneDepth / 2;
      const zMax = startZoneDepth / 2;

      return { xMin, xMax, zMin, zMax };
  }

  createDebugStartZone() {
    const b = this.getStartZoneBounds();
    const sizeX = b.xMax - b.xMin;
    const sizeZ = b.zMax - b.zMin;
    const geometry = new THREE.BoxGeometry(sizeX, 0.01, sizeZ);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      opacity: 0.05,
      transparent: true,
    });
    this.debugStartZoneMesh = new THREE.Mesh(geometry, material);
    this.debugStartZoneMesh.position.set((b.xMin + b.xMax) / 2, 0.11, (b.zMin + b.zMax) / 2);
    this.debugStartZoneMesh.visible = false; // Oculto por defecto
    this.scene.add(this.debugStartZoneMesh);
  }


  isInsideStartZone(position) {
    const b = this.getStartZoneBounds();
    const { x, z } = position;
    return x >= b.xMin && x <= b.xMax && z >= b.zMin && z <= b.zMax;
  }
  
  setDebugStartZoneVisible(visible) {

    if (this.debugStartZoneMesh) {
      this.debugStartZoneMesh.visible = visible;
          console.log('visible',visible)
    }
  }

  setEditableState(isEditing) {
    console.log(isEditing)
    if (!this.folder) return
    
    const folderEl = this.folder.element
    if (folderEl) {
      folderEl.style.opacity = isEditing ? '1' : '0.5'
      folderEl.style.pointerEvents = isEditing ? 'auto' : 'none'
    }

    // Controlar visibilidad de la zona de debug
    this.setDebugStartZoneVisible(isEditing);

    // Añadir o quitar collider físico
    if (isEditing) {
        this.removeStartZoneCollider();   // borrar el anterior SIEMPRE
        this.createStartZoneCollider();   // crearlo limpio
    }
    else {
        setTimeout(() => {
            this.removeStartZoneCollider(); // mejor borrar que esconder
        }, 100);
    }
  }

  createStartZoneCollider() {
    if (this.startZoneBody) return; // evitar duplicados

    const b = this.getStartZoneBounds();
    const sizeX = b.xMax - b.xMin;
    const sizeZ = b.zMax - b.zMin;

    const halfX = sizeX * 0.5;
    const halfZ = sizeZ * 0.5;

    // ALTURA total = 10 → halfHeight = 5
    const halfY = 10;

    // centro del startZone
    const centerX = (b.xMin + b.xMax) / 2;
    const centerZ = (b.zMin + b.zMax) / 2;

    // Elevar el collider para que quede centrado en la altura
    const centerY = 10;

    this.startZoneBody = this.physics.addEntity({
      type: 'fixed',
      position: { x: centerX, y: centerY, z: centerZ },
      colliders: [{
        shape: 'cuboid',
        parameters: [halfX, halfY, halfZ],
        restitution: 0,
        friction: 0.5
      }]
    });

        this.showStartZoneCollider(centerX, centerY, centerZ);
  }

  removeStartZoneCollider() {
    if (this.startZoneBody) {
      this.physics.removeEntity(this.startZoneBody);
      this.startZoneBody = null;
    }
  }

  hideStartZoneCollider() {
    if (!this.startZoneBody) return;
    const body = this.startZoneBody.physical.body;

    // Lo mandás lejos hacia abajo
    body.setTranslation({ x: 0, y: -10000, z: 0 }, true);
  }

  showStartZoneCollider(realX, realY, realZ) {
    if (!this.startZoneBody) return;
    const body = this.startZoneBody.physical.body;

    body.setTranslation({ x: realX, y: realY, z: realZ }, true);
  }

  saveToLocal() {
    const data = { ...this.PARAMS };
    localStorage.setItem("floor_config", JSON.stringify(data));
    console.log("Floor config saved:", data);
  }

  loadFromLocal() {
    const json = localStorage.getItem("floor_config");
    if (!json) return;

    const saved = JSON.parse(json);
    console.log("Floor config loaded:", saved);

    // Copiar valores al objeto PARAMS
    Object.assign(this.PARAMS, saved);

    // Aplicar valores al material actual
    this.applyParamsToMaterial();
  }

  applyParamsToMaterial() {
    if (!this.subFloorMaterial) return;

    this.subFloorMaterial.borderWidth = this.PARAMS.width;
    this.subFloorMaterial.borderOffset = this.PARAMS.offset;
    this.subFloorMaterial.stripeSize = this.PARAMS.stripeSize;
    this.subFloorMaterial.opacity = this.PARAMS.opacity;

    // Cambiar preset (crea nuevo material)
    const newMaterial = GridNodeMaterial.fromPreset(this.PARAMS.preset);

    newMaterial.gridSize = this.subFloorMaterial.gridSize;
    newMaterial.borderColor = this.subFloorMaterial.borderColor;
    newMaterial.borderWidth = this.PARAMS.width;
    newMaterial.borderOffset = this.PARAMS.offset;
    newMaterial.stripeSize = this.PARAMS.stripeSize;
    newMaterial.opacity = this.PARAMS.opacity;

    const subFloorMesh = this.floorGroup.children.find(
      m => m.material === this.subFloorMaterial
    );

    if (subFloorMesh) subFloorMesh.material = newMaterial;

    this.subFloorMaterial.dispose();
    this.subFloorMaterial = newMaterial;
  }
}

export default Floor