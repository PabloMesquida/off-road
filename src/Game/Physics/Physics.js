import * as RAPIER from '@dimforge/rapier3d-compat'
import Game from "../Game.js"

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

    this.game.time.events.on('tick', () => { this.update() }, 2)
  }

  update(){
    if (!this.world) return

    this.world.step()
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

    // 1. Crear el cuerpo rígido (RigidBody) según type
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

    if (_desc.mass) {
      bodyDesc.setAdditionalMass(_desc.mass)
    }

    const body = this.world.createRigidBody(bodyDesc)

    // 2. Crear los colliders
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

          default:
            console.warn(`Forma no soportada: ${colliderDef.shape}`)
        }

        if (colliderDesc) {
          if (typeof colliderDef.restitution === 'number') {
            colliderDesc.setRestitution(colliderDef.restitution)
          }
          if (typeof colliderDef.friction === 'number') {
            colliderDesc.setFriction(colliderDef.friction)
          }
          const collider = this.world.createCollider(colliderDesc, body)
          colliders.push(collider)
        }
      })
    }

    // 3. Devolver el paquete físico
    return { body, colliders }
  }
}

export default Physics