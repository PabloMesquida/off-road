import * as THREE from 'three/webgpu'
import * as RAPIER from '@dimforge/rapier3d-compat'
import Game from "../Game.js"
import Floor from './Floor/Floor.js'
import Vehicle from './Vehicle/Vehicle.js'
import Events from '../Utils/Events.js'
import Environment from './Environment/Environment.js'
import AssetManager from './Assets/AssetManager.js'
import { TransformControls } from 'three/examples/jsm/Addons.js'

class World {
  constructor() {
    this.game = new Game()
    this.inputs = this.game.inputs
    this.scene = new THREE.Scene()
    this.events = new Events()

    this.resources = this.game.resources
    this.floor = new Floor(this.scene, this.game.physics, { x: 160, y: 0.2, z: 160 })

    this.initialVehiclePosition = new THREE.Vector3(0, 2, 0)
    this.initialVehicleRotation = new THREE.Quaternion()

    this.raycaster = new THREE.Raycaster()
    this.pointer = new THREE.Vector2()
    this.isPlacingAsset = false
    this.currentAssetType = null // 'cone', 'barrel', etc.

    this.selectedAsset = null
    this.hoveredAsset = null
    this.transformControls = null

    this.domElement = this.game.domElement
    this.camera = null

    // Estados para control de cursor
    this.isDraggingAsset = false
    this.isHoveringAsset = false

    // Asset managers por tipo
    this.assetManagers = {}

    // tweakpane
    this.initTweakpane()

    this.resources.events.on('ready', () => {
      this.vehicle = new Vehicle(this.scene, this.game.physics)
      if (this.vehicle?.chassis?.mesh) {
        this.initialVehicleRotation.copy(this.vehicle.chassis.mesh.quaternion)
      }
      this.environment = new Environment(this.scene)
      
      // Inicializar managers para diferentes tipos de assets
      this.assetManagers.cone = new AssetManager(this.scene, { 
        resourcePathName: "coneModel",
        assetType: "cone"
      })
      this.assetManagers.barrel = new AssetManager(this.scene, { 
        resourcePathName: "barrelModel",
        assetType: "barrel"
      })
    })

    this.isEditing = false
    this.toggleEditMode(this.isEditing)
  }

  /* ─────────────────────────────────────────────
   * Tweakpane
   * ───────────────────────────────────────────── */
  initTweakpane() {
    try {
      this.pane = this.game.pane
      this.assetsfolder = this.pane.addFolder({ title: 'Assets', expanded: false })
      this.editParam = { editMode: false }

      this.pane.addBinding(this.editParam, 'editMode', { label: 'EDIT MODE' })
        .on('change', ev => this.toggleEditMode(ev.value))

      this.placingButtonCone = this.assetsfolder.addButton({ title: 'Cone' })
      this.placingButtonCone.on('click', () => this.togglePlacingAsset('cone'))

      this.placingButtonBarrel = this.assetsfolder.addButton({ title: 'Barrel' })
      this.placingButtonBarrel.on('click', () => this.togglePlacingAsset('barrel'))

      this.updateTweakpaneState(false)
    } catch (e) {
      console.warn('[World] Tweakpane no disponible:', e)
    }
  }

  updateTweakpaneState(isEditing) {
    const el = this.assetsfolder?.element
    if (el) {
      el.style.opacity = isEditing ? '1' : '0.5'
      el.style.pointerEvents = isEditing ? 'auto' : 'none'
    }
  }

  /* ─────────────────────────────────────────────
   * Control Centralizado del Cursor
   * ───────────────────────────────────────────── */
  updateCursor() {
    if (!this.domElement) return

    if (this.isPlacingAsset) {
      this.domElement.style.cursor = 'crosshair'
    } else if (this.isDraggingAsset) {
      this.domElement.style.cursor = 'grabbing'
    } else if (this.isHoveringAsset) {
      this.domElement.style.cursor = 'pointer'
    } else if (this.isEditing) {
      this.domElement.style.cursor = 'grab'
    } else {
      this.domElement.style.cursor = 'default'
    }
  }

  /* ─────────────────────────────────────────────
   * Edit Mode Toggle
   * ───────────────────────────────────────────── */
  toggleEditMode(isEditing) {
    this.isEditing = isEditing
    this.updateTweakpaneState(isEditing)

    if (this.game?.view && typeof this.game.view.setEditMode === 'function') {
      this.game.view.setEditMode(this.isEditing)
    } else {
      console.warn('View not ready yet when toggling edit mode.')
    }
      
    // Actualizar estado de edición en el piso
    if (this.floor?.setEditableState)
      this.floor.setEditableState(isEditing)

    if (isEditing) {
      console.log('Edit mode ON')

      // Resetear vehículo a posición inicial
      if (this.vehicle?.chassis?.body) {
        const body = this.vehicle.chassis.body
        body.setTranslation(this.initialVehiclePosition, true)
        body.setRotation(this.initialVehicleRotation, true)
        body.setLinvel({ x: 0, y: 0, z: 0 }, true)
        body.setAngvel({ x: 0, y: 0, z: 0 }, true)
      }

      // Crear transform controls si no existen
      if (!this.transformControls) {
        this.createTransformControls()
      }

      // Activar listeners de escena solo en modo edición
      this.domElement.addEventListener('pointermove', this.onPointerHoverAsset);
      this.domElement.addEventListener('pointerdown', this.onPointerSelectAsset);

    } else {
      console.log('Edit mode OFF')

      // Desactivar colocación de assets si estaba activa
      if (this.isPlacingAsset) {
        this.disablePlacing()
      }

      // Resetear estados de cursor
      this.isDraggingAsset = false
      this.isHoveringAsset = false

      // Eliminar transform controls
      if (this.transformControls) {
        this.scene.remove(this.transformControls.getHelper());
        this.transformControls.dispose();
        this.transformControls = null;
      }

      // Limpiar selección
      this.highlightAsset(this.selectedAsset, false);
      this.selectedAsset = null;
      this.hoveredAsset = null;

      // Quitar listeners de escena
      this.domElement.removeEventListener('pointermove', this.onPointerHoverAsset);
      this.domElement.removeEventListener('pointerdown', this.onPointerSelectAsset);
      this.domElement.removeEventListener('pointermove', this.onPointerMove);
      this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    }

    this.updateCursor()
  }

  createTransformControls() {
    const camera = this.game.view.camera
    const domElement = this.game.domElement
    this.transformControls = new TransformControls(camera, domElement)

    this.transformControls.showX = true
    this.transformControls.showY = false 
    this.transformControls.showZ = true 

    this.inputs.events.on('translateMode', (isDown) => {
      if (isDown) {
        this.transformControls.setMode('translate')
        this.transformControls.showX = true
        this.transformControls.showY = false 
        this.transformControls.showZ = true 
      }
    })

    this.inputs.events.on('rotateMode', (isDown) => {
      if (isDown) {
        this.transformControls.setMode('rotate')
        this.transformControls.showX = false 
        this.transformControls.showY = true 
        this.transformControls.showZ = false 
      }
    })

    // Personalización visual
    this.transformControls.setColors(
      0xFFFFFF50,  // X
      0xFFFFFF,  // Y
      0xFFFFFF50,  // Z
      0xffff00   // activo
    )

    this.transformControls.setSpace('world')
    this.transformControls.rotationSnap = THREE.MathUtils.degToRad(5)

    this.scene.add(this.transformControls.getHelper())

    // Cuando se arrastra un objeto
    this.transformControls.addEventListener('dragging-changed', (e) => {
      this.isDraggingAsset = e.value
      this.updateCursor()
      
      const assetData = this.findAssetData(this.selectedAsset)
      if (!assetData?.body) return

      if (e.value) {
        // Empieza a mover → hacerlo kinematic
        assetData.body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true)
      } else {
        // Soltó → volverlo dinámico
        assetData.body.setBodyType(RAPIER.RigidBodyType.Dynamic, true)
      }
    })

    this.transformControls.addEventListener('objectChange', () => {
      const assetData = this.findAssetData(this.selectedAsset)
      if (assetData?.body) {
        const pos = assetData.group.position
        const rot = assetData.group.quaternion
        assetData.body.setNextKinematicTranslation(pos)
        assetData.body.setNextKinematicRotation(rot)
      }
    })
  }

  /* ─────────────────────────────────────────────
   * Placing Mode
   * ───────────────────────────────────────────── */
 togglePlacingAsset(assetType) {
  console.log(`🔧 [DEBUG] togglePlacingAsset called:`, {
    assetType,
    isEditing: this.isEditing,
    isPlacingAsset: this.isPlacingAsset,
    currentAssetType: this.currentAssetType
  });

  if (!this.isEditing) {
    console.warn('No puedes colocar assets fuera del modo edición.')
    return
  }

  // Si ya está colocando el mismo tipo, desactivar
  if (this.isPlacingAsset && this.currentAssetType === assetType) {
    this.disablePlacing()
    return
  }

  // IMPORTANTE: Desactivar cualquier preview anterior
  if (this.isPlacingAsset && this.currentAssetType) {
    const previousManager = this.assetManagers[this.currentAssetType]
    if (previousManager) {
      previousManager.disposePreview()
    }
  }

  this.forceCleanPreviews();

  this.currentAssetType = assetType
  this.isPlacingAsset = true
  
  this.enablePlacing()
  
  this.updateCursor()
}


 enablePlacing() {
  if (!this.isEditing || !this.currentAssetType) return
  
  // Verificar estado actual de todos los managers
  for (const type in this.assetManagers) {
    const manager = this.assetManagers[type]
  }
  
  const manager = this.assetManagers[this.currentAssetType]
  if (manager) {
    manager.createPreview()
  }
  
  this.domElement.addEventListener('pointermove', this.onPointerMove)
  this.domElement.addEventListener('pointerdown', this.onPointerDown)
  this.updateCursor()
}

forceCleanPreviews() {
  // Remover manualmente todos los grupos de preview de la escena
  this.scene.traverse((child) => {
    if (child.userData?.isPreview) {
      this.scene.remove(child);
    }
  });
  
  // Resetear todos los managers
  for (const assetType in this.assetManagers) {
    const manager = this.assetManagers[assetType]
    if (manager) {
      manager.preview = null;
    }
  }
}

 disablePlacing() {
  // Desactivar TODOS los previews
  for (const assetType in this.assetManagers) {
    const manager = this.assetManagers[assetType]
    if (manager && manager.disposePreview) {
      manager.disposePreview()
    }
  }
  
  this.domElement.removeEventListener('pointermove', this.onPointerMove)
  this.domElement.removeEventListener('pointerdown', this.onPointerDown)
  this.isPlacingAsset = false
  this.currentAssetType = null
  this.updateCursor()
}
  /* ─────────────────────────────────────────────
   * Hover y Selección de Assets
   * ───────────────────────────────────────────── */
  findAssetGroup(object) {
    if (!this.assetManagers) return null
    
    let node = object
    while (node) {
      // Buscar en todos los asset managers
      for (const assetType in this.assetManagers) {
        const manager = this.assetManagers[assetType]
        if (manager?.instances) {
          const found = manager.instances.find(instance => instance.group === node)
          if (found) return node
        }
      }
      node = node.parent
    }
    return null
  }

  findAssetData(group) {
    if (!group || !this.assetManagers) return null
    
    for (const assetType in this.assetManagers) {
      const manager = this.assetManagers[assetType]
      if (manager?.instances) {
        const found = manager.instances.find(instance => instance.group === group)
        if (found) return found
      }
    }
    return null
  }

  getAllAssetInstances() {
    const allInstances = []
    for (const assetType in this.assetManagers) {
      const manager = this.assetManagers[assetType]
      if (manager?.instances) {
        allInstances.push(...manager.instances)
      }
    }
    return allInstances
  }

  highlightAsset(group, highlight = true) {
    if (!group) return
    group.traverse(c => {
      if (c.isMesh) {
        if (highlight) {
          if (!c.userData.originalMaterial) {
            c.userData.originalMaterial = c.material
            c.material = c.material.clone()
          }
          c.material.emissive?.setHex(0x333333)
        } else {
          if (c.userData.originalMaterial) {
            c.material.dispose()
            c.material = c.userData.originalMaterial
            delete c.userData.originalMaterial
          }
        }
      }
    })
  }

  onPointerHoverAsset = (e) => {
    if (!this.isEditing || this.isPlacingAsset || this.isDraggingAsset) return

    const camera = this.game.view.camera
    if (!camera) return

    const rect = this.domElement.getBoundingClientRect()
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.pointer, camera)

    const allAssets = this.getAllAssetInstances().map(instance => instance.group)
    const intersects = this.raycaster.intersectObjects(allAssets, true)

    if (intersects.length > 0) {
      const hit = intersects[0]
      const assetGroup = this.findAssetGroup(hit.object)
      if (assetGroup && assetGroup !== this.hoveredAsset) {
        this.highlightAsset(this.hoveredAsset, false)
        this.hoveredAsset = assetGroup
        this.highlightAsset(this.hoveredAsset, true)
        this.isHoveringAsset = true
      }
    } else {
      this.highlightAsset(this.hoveredAsset, false)
      this.hoveredAsset = null
      this.isHoveringAsset = false
    }
    
    this.updateCursor()
  }

  onPointerSelectAsset = (e) => {
    if (!this.isEditing || this.isPlacingAsset || this.isDraggingAsset) return
    if (e.button !== 0) return

    const camera = this.game.view.camera
    if (!camera) return

    const rect = this.domElement.getBoundingClientRect()
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(this.pointer, camera)

    const allAssets = this.getAllAssetInstances().map(instance => instance.group)
    const intersects = this.raycaster.intersectObjects(allAssets, true)

    if (intersects.length > 0) {
      const hit = intersects[0]
      const assetGroup = this.findAssetGroup(hit.object)
      if (assetGroup) {
        if (this.selectedAsset !== assetGroup) {
          this.highlightAsset(this.selectedAsset, false)
          this.selectedAsset = assetGroup
          this.highlightAsset(this.selectedAsset, true)
          this.transformControls.attach(this.selectedAsset)

          // Ajustar tamaño del gizmo según el objeto
          const box = new THREE.Box3().setFromObject(this.selectedAsset)
          const size = new THREE.Vector3()
          box.getSize(size)
          
          const maxSize = Math.max(size.x * 0.5, size.y * 0.5, size.z * 0.5)
          const offset = 0.05 
          this.transformControls.setSize(maxSize + offset)
        }
      }
    } else {
      // clic fuera: deseleccionar
      this.highlightAsset(this.selectedAsset, false)
      this.selectedAsset = null
      this.transformControls.detach()
    }
    
    this.updateCursor()
  }

  /* ─────────────────────────────────────────────
   * Colocación de assets
   * ───────────────────────────────────────────── */
  onPointerMove = (e) => {
    if (!this.isPlacingAsset || !this.currentAssetType) return
    
    const camera = this.game.view.camera
    if (!camera) return
    const rect = this.domElement.getBoundingClientRect()
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(this.pointer, camera)

    const floorMesh = this.floor?.mesh
    const intersects = floorMesh
      ? this.raycaster.intersectObject(floorMesh, true)
      : []
    const hit = intersects[0]
    if (hit) {
      const pos = { x: hit.point.x, y: hit.point.y + 0.1, z: hit.point.z }
      const manager = this.assetManagers[this.currentAssetType]
      manager?.updatePreviewPosition(pos)
    } else {
      const manager = this.assetManagers[this.currentAssetType]
      manager?.updatePreviewPosition(null)
    }
  }

  onPointerDown = (e) => {
    if (!this.isPlacingAsset || !this.currentAssetType) return
    if (e.button !== 0) return
    const camera = this.game.view.camera
    if (!camera) return

    const rect = this.domElement.getBoundingClientRect()
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(this.pointer, camera)

    const floorMesh = this.floor?.mesh
    const intersects = this.raycaster.intersectObject(floorMesh, true)
    const hit = intersects[0]
    if (hit) {
      const manager = this.assetManagers[this.currentAssetType]
      if (manager?.spawn) {
        const spawnPos = { x: hit.point.x, y: hit.point.y, z: hit.point.z }
        manager.spawn(spawnPos)
      }
    }
  }

  /* ─────────────────────────────────────────────
   * Update Loop
   * ───────────────────────────────────────────── */
  update() {
    if(this.selectedAsset) {
      // Actualizar todos los assets de todos los managers
      for (const assetType in this.assetManagers) {
        const manager = this.assetManagers[assetType]
        if (manager?.instances) {
          for (const instance of manager.instances) {
            const body = instance.body
            if (!body || body.isKinematic()) continue

            const vel = body.linvel()
            // Limita la velocidad de los assets
            const maxSpeed = 0.5
            const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z)
            if (speed > maxSpeed) {
              const scale = maxSpeed / speed
              body.setLinvel({ x: vel.x * scale, y: vel.y * scale, z: vel.z * scale }, true)
            }
          }
        }
      }
    }

    if (!this.vehicle) return
    const pos = this.vehicle.chassis.mesh.position
    const limit = this.floor.getLimit()
    const vel = this.vehicle.chassis.body.linvel()

    const isOutsideX = Math.abs(pos.x) > limit
    const isOutsideZ = Math.abs(pos.z) > limit
    const movingOutwardX = Math.sign(vel.x) === Math.sign(pos.x) && isOutsideX
    const movingOutwardZ = Math.sign(vel.z) === Math.sign(pos.z) && isOutsideZ

    const shouldBrake = movingOutwardX || movingOutwardZ
    this.vehicle.controller.isOutsideLimit = shouldBrake
    this.vehicle.visuals.isOutsideLimit = shouldBrake
  }
}

export default World