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

  // ─────────────────────────────
  // 1. RigidBody
  // ─────────────────────────────

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
    const po = _desc.physicsOptions || {}

    bodyDesc.setLinearDamping(
      typeof po.linearDamping === 'number' ? po.linearDamping : 0.2
    )

    bodyDesc.setAngularDamping(
      typeof po.angularDamping === 'number' ? po.angularDamping : 0.8
    )
  }

  bodyDesc.setCanSleep(true)

  // posición
  if (_desc.position) {
    bodyDesc.setTranslation(
      _desc.position.x,
      _desc.position.y,
      _desc.position.z
    )
  }

  // rotación
  if (_desc.rotation) {
    const { x, y, z, w } = _desc.rotation
    bodyDesc.setRotation({ x, y, z, w })
  }

  // ─────────────────────────────
  // Mass
  // ─────────────────────────────

  const mp = _desc.massProperties

  if (mp && mp.useAdditionalMassProperties) {
    bodyDesc.setAdditionalMassProperties(
      mp.massValue ?? 10,
      mp.com ?? { x: 0, y: 0, z: 0 },
      mp.principalInertia ?? { x: 1, y: 1, z: 1 },
      mp.inertiaFrame ?? { w: 1, x: 0, y: 0, z: 0 }
    )
  } else if (typeof _desc.mass === 'number') {
    bodyDesc.setAdditionalMass(_desc.mass)
  }

  const po = _desc.physicsOptions || {}

  if (typeof po.ccd === 'boolean') bodyDesc.setCcdEnabled(po.ccd)
  if (typeof po.solverIterations === 'number')
    bodyDesc.setAdditionalSolverIterations(po.solverIterations)

  const body = this.world.createRigidBody(bodyDesc)

  const GROUPS = {
    DEFAULT: 0b0001,
    VEHICLE: 0b0010,
    EDITOR:  0b0100
  }

  const getCollisionGroups = (membership, filter) =>
    (membership << 16) | filter

  // ─────────────────────────────
  // Colliders
  // ─────────────────────────────

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

        // density
        if (mp && mp.collidersContribute === false) {
          colliderDesc.setDensity(0)
        } else if (typeof colliderDef.density === 'number') {
          colliderDesc.setDensity(colliderDef.density)
        }

        // material
        if (typeof colliderDef.restitution === 'number')
          colliderDesc.setRestitution(colliderDef.restitution)

        if (typeof colliderDef.friction === 'number')
          colliderDesc.setFriction(colliderDef.friction)

        // offset
        if (colliderDef.offset) {
          colliderDesc.setTranslation(
            colliderDef.offset.x,
            colliderDef.offset.y,
            colliderDef.offset.z
          )
        }

        // rotation
        if (colliderDef.rotation) {
          if ("w" in colliderDef.rotation) {
            colliderDesc.setRotation(colliderDef.rotation)
          } else {
            const e = colliderDef.rotation
            const q = new THREE.Quaternion()
            q.setFromEuler(new THREE.Euler(e.x, e.y, e.z))
            colliderDesc.setRotation(q)
          }
        }

        const group = colliderDef.collisionGroup || _desc.collisionGroup

        let membership = GROUPS.DEFAULT
        let filter = GROUPS.DEFAULT | GROUPS.VEHICLE | GROUPS.EDITOR

        if (group === "vehicle") {
          membership = GROUPS.VEHICLE
          filter = GROUPS.VEHICLE
        }

        if (group === "editor") {
          membership = GROUPS.EDITOR
          filter = GROUPS.EDITOR
        }

        colliderDesc.setCollisionGroups(
          getCollisionGroups(membership, filter)
        )

        const collider = this.world.createCollider(colliderDesc, body)
        colliders.push(collider)
      }
    })
  }

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

  getCollisionGroups(membership, filter) {
    return (membership << 16) | filter
  }
}

export default Physics
