
import * as THREE from 'three'

//  Materiales globales reutilizables
export const GLOBAL_MATERIALS = {
  naranja: new THREE.MeshStandardMaterial({ color: 0xad4800, metalness: 0, roughness: 0.9 }),
  blanco:  new THREE.MeshStandardMaterial({ color: 0xf5e8df, metalness: 0, roughness: 0.9 }),
  azul:    new THREE.MeshStandardMaterial({ color: 0x0066cc, metalness: 0, roughness: 0.9 }),
  celeste: new THREE.MeshStandardMaterial({ color: 0x608ebd, metalness: 0, roughness: 0.9 }),
  rojo:    new THREE.MeshStandardMaterial({ color: 0xcc0000, metalness: 0, roughness: 0.9 }),
  verde:   new THREE.MeshStandardMaterial({ color: 0x00cc00, metalness: 0, roughness: 0.9 }),
  amarillo:new THREE.MeshStandardMaterial({ color: 0xcccc00, metalness: 0, roughness: 0.9 }),
  negro:   new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0, roughness: 0.9 }),
  gris:    new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0, roughness: 0.9 }),
  default: new THREE.MeshStandardMaterial({ color: 0xffffaa, metalness: 0, roughness: 0.9 })
}

// Configuración individual por tipo de asset
export const ASSET_CONFIGS = (size) => ({
  cone: {
    materialMapping: {
      base: 'naranja',
      naranja: 'naranja',
      blanco: 'blanco'
    },
    physics: {
      type: 'dynamic',
      massProperties: {
        useAdditionalMassProperties: true,
        massValue: 1.0,
        com: { x: 0, y: -size.y / 4, z: 0 }
      },
      colliders: [
        { shape: 'cuboid', parameters: [size.x * 0.5, size.y * 0.5, size.z * 0.5], friction: 2.5 }
      ]
    },
    verticalOffset: -size.y / 2
  },

  barrel: {
    materialMapping: {
      base: 'azul',
      azul: 'azul',
      naranja: 'celeste'
    },
    physics: {
      type: 'dynamic',
      massProperties: {
        useAdditionalMassProperties: true,
        massValue: 2.5,
        com: { x: 0, y: -size.y / 4, z: 0 }
      },
      colliders: [
        { shape: 'cuboid', parameters: [size.x * 0.5, size.y * 0.5, size.z * 0.5], friction: 2.5 }
      ]
    },
    verticalOffset: -size.y / 2
  }
})
