import * as THREE from 'three'
import * as RAPIER from '@dimforge/rapier3d-compat'
import Game from "../../core/Game.js"

class Physics{
  constructor(){
    this.entities = new Map()
    this.entitiesKey = 0
    this.world = null
    this.ready = this.init()
  }
  
  async init() {
    await RAPIER.init()  
    const gravity = new RAPIER.Vector3(0.0, -9.81, 0.0)
    this.world = new RAPIER.World(gravity)
    this.game = new Game()
  }

  syncEntities(){
  if (!this.world) return
  this.entities.forEach((_entity) => {
    if(_entity.visual){
      _entity.visual.position.copy(_entity.physical.body.translation())
      _entity.visual.quaternion.copy(_entity.physical.body.rotation())
    }
  }) 
}

  addEntity(_physicalDescription = null, _visual = null){
    if (!this.world) return

    const entity = {
      physical: this.getPhysical(_physicalDescription),
      visual: _visual
    }
    this.entitiesKey++
    this.entities.set(this.entitiesKey, entity)

    return entity
  }

  getPhysical(_desc) {
    if (!_desc) return null

    // 1. Crear el RigidBody según type
    let bodyDesc
    switch (_desc.type) {
      case 'dynamic':
        bodyDesc = RAPIER.RigidBodyDesc.dynamic()
        break
      case 'fixed':
        bodyDesc = RAPIER.RigidBodyDesc.fixed()
        break
      case 'kinematic':
        bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
        break
      default:
        console.warn(`Tipo de cuerpo no soportado: ${_desc.type}, usando dynamic por defecto`)
        bodyDesc = RAPIER.RigidBodyDesc.dynamic()
    }

    if (_desc.type === "dynamic") {
      const po = _desc.physicsOptions || {};

      if (typeof po.linearDamping !== 'number')
        bodyDesc.setLinearDamping(0.2)
      else
        bodyDesc.setLinearDamping(po.linearDamping)

      if (typeof po.angularDamping !== 'number')
        bodyDesc.setAngularDamping(0.8)
      else
        bodyDesc.setAngularDamping(po.angularDamping)
    }

    bodyDesc.setCanSleep(true)

    // 2. Posición y rotación inicial
    if (_desc.position) {
      bodyDesc.setTranslation(
        _desc.position.x,
        _desc.position.y,
        _desc.position.z
      )
    }

    if (_desc.rotation) {
      const { x, y, z, w } = _desc.rotation
      bodyDesc.setRotation({ x, y, z, w })
    }

    // Mass / massProperties (usamos preferentemente massProperties si vienen)
    const mp = _desc.massProperties
    if (mp && mp.useAdditionalMassProperties) {
      // esperar objetos bien formados; si faltan campos usamos valores por defecto razonables
      const massVal = (typeof mp.massValue === 'number') ? mp.massValue : (_desc.mass ?? 10)
      const com = mp.com || { x: 0.0, y: 0.0, z: 0.0 }
      const principalInertia = mp.principalInertia || { x: 1.0, y: 1.0, z: 1.0 }
      const inertiaFrame = mp.inertiaFrame || { w: 1.0, x: 0.0, y: 0.0, z: 0.0 }

      // Aplica setAdditionalMassProperties con los valores pasados desde addEntity
      bodyDesc.setAdditionalMassProperties(
        massVal,
        { x: com.x, y: com.y, z: com.z },
        { x: principalInertia.x, y: principalInertia.y, z: principalInertia.z },
        { w: inertiaFrame.w, x: inertiaFrame.x, y: inertiaFrame.y, z: inertiaFrame.z }
      )
    } else if (typeof _desc.mass === 'number') {
      // compatibilidad: si sólo pasas mass, lo aplicamos con setAdditionalMass
      bodyDesc.setAdditionalMass(_desc.mass)
    }

    // Opciones de estabilidad/ayuda (opcionales, puedes pasarlas en _desc.physicsOptions)
    const po = _desc.physicsOptions || {};
    if (typeof po.linearDamping !== 'number') bodyDesc.setLinearDamping(0.2);
    else bodyDesc.setLinearDamping(po.linearDamping);

    if (typeof po.angularDamping !== 'number') bodyDesc.setAngularDamping(0.8);
    else bodyDesc.setAngularDamping(po.angularDamping);

    if (typeof po.ccd === 'boolean') bodyDesc.setCcdEnabled(po.ccd);
    if (typeof po.solverIterations === 'number') bodyDesc.setAdditionalSolverIterations(po.solverIterations);

    const body = this.world.createRigidBody(bodyDesc);

    //  Crear los colliders
    const colliders = []

    if (Array.isArray(_desc.colliders)) {
      _desc.colliders.forEach(colliderDef => {
        let colliderDesc
        
        switch (colliderDef.shape) {
          case 'cuboid':
            colliderDesc = RAPIER.ColliderDesc.cuboid(...colliderDef.parameters)
            break

          case 'sphere':
            colliderDesc = RAPIER.ColliderDesc.ball(...colliderDef.parameters)
            break

          case 'capsule':
            colliderDesc = RAPIER.ColliderDesc.capsule(...colliderDef.parameters)
            break

          case 'plane':
            colliderDesc = RAPIER.ColliderDesc.cuboid(...colliderDef.parameters)
            break

          case 'cone':
            colliderDesc = RAPIER.ColliderDesc.cone(...colliderDef.parameters)
            break

          case 'trimesh':
            colliderDesc = RAPIER.ColliderDesc.trimesh(
              colliderDef.parameters.vertices,
              colliderDef.parameters.indices
            )
            break

          case 'convex':
            colliderDesc = RAPIER.ColliderDesc.convexMesh(
              colliderDef.parameters.vertices
            )
            break
          
          case 'cylinder':
            colliderDesc = RAPIER.ColliderDesc.cylinder(
              colliderDef.parameters[0],
              colliderDef.parameters[1]
            )
            break

          case 'hull':
            colliderDesc = RAPIER.ColliderDesc.convexHull(
              colliderDef.parameters.vertices
            )
            break

          default:
            console.warn(`Forma no soportada: ${colliderDef.shape}`)
        }

       if (colliderDesc) {
        // Si se pide que los colliders NO contribuyan a la masa, ponemos density = 0
        // (cuando usas setAdditionalMassProperties quieres controlar tú la masa)
        if (mp && mp.collidersContribute === false) {
          colliderDesc.setDensity(0)
        } else if (typeof colliderDef.density === 'number') {
          colliderDesc.setDensity(colliderDef.density)
        }

        if (typeof colliderDef.restitution === 'number') {
          colliderDesc.setRestitution(colliderDef.restitution)
        }
        if (typeof colliderDef.friction === 'number') {
          colliderDesc.setFriction(colliderDef.friction)
        }
        if (colliderDef.offset) {
          colliderDesc.setTranslation(colliderDef.offset.x, colliderDef.offset.y, colliderDef.offset.z)
        }

        if (colliderDef.rotation) {
          // si viene como quaternion
          if ("w" in colliderDef.rotation) {
            const { x, y, z, w } = colliderDef.rotation
            colliderDesc.setRotation({ x, y, z, w })
          }

          // si viene como euler
          else {
            const e = colliderDef.rotation
            const q = new THREE.Quaternion()
            q.setFromEuler(new THREE.Euler(e.x, e.y, e.z))

            colliderDesc.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
          }
        }

        const collider = this.world.createCollider(colliderDesc, body)
        colliders.push(collider)
      }
      })
    }

    // 3. Devolver el paquete físico
    return { body, colliders }
  }

  // Método para eliminar entidades
  removeEntity(entity) {
    if (!entity || !this.world) return false

    try {
      // Buscar la entidad en el Map
      let entityKey = null
      for (const [key, value] of this.entities.entries()) {
        if (value === entity || value.physical?.body === entity) {
          entityKey = key
          break
        }
      }

      if (entityKey) {
        const entityData = this.entities.get(entityKey)
        
        // Eliminar colliders primero
        if (entityData.physical?.colliders) {
          entityData.physical.colliders.forEach(collider => {
            this.world.removeCollider(collider, true)
          })
        }

        // Eliminar el cuerpo rígido
        if (entityData.physical?.body) {
          this.world.removeRigidBody(entityData.physical.body)
        }

        // Eliminar del Map
        this.entities.delete(entityKey)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error al eliminar entidad física:', error)
      return false
    }
  }

  // Método alternativo para eliminar por key
  removeEntityByKey(key) {
    if (!this.entities.has(key)) return false

    try {
      const entity = this.entities.get(key)
      
      // Eliminar colliders
      if (entity.physical?.colliders) {
        entity.physical.colliders.forEach(collider => {
          this.world.removeCollider(collider, true)
        })
      }

      // Eliminar cuerpo rígido
      if (entity.physical?.body) {
        this.world.removeRigidBody(entity.physical.body)
      }

      // Eliminar del Map
      this.entities.delete(key)
      return true
    } catch (error) {
      console.error('Error al eliminar entidad física por key:', error)
      return false
    }
  }

  // Método para obtener todas las keys de entidades (útil para debugging)
  getEntityKeys() {
    return Array.from(this.entities.keys())
  }

  // Método para obtener una entidad por key
  getEntity(key) {
    return this.entities.get(key)
  }

}

export default Physics
