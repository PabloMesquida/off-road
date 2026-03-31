import * as THREE from 'three'

export const GLOBAL_MATERIALS = {
  naranja: new THREE.MeshStandardMaterial({ color: 0xad4800, metalness: 0, roughness: 0.9 }),
  blanco:  new THREE.MeshStandardMaterial({ color: 0xf5e8df, metalness: 0, roughness: 0.9 }),
  azul:    new THREE.MeshStandardMaterial({ color: 0x0066cc, metalness: 0, roughness: 0.9 }),
  celeste: new THREE.MeshStandardMaterial({ color: 0x608ebd, metalness: 0, roughness: 0.9 }),
  rojo:    new THREE.MeshStandardMaterial({ color: 0xcc0000, metalness: 0, roughness: 0.9 }),
  verde:   new THREE.MeshStandardMaterial({ color: 0x00cc00, metalness: 0, roughness: 0.9 }),
  amarillo:new THREE.MeshStandardMaterial({ color: 0x5A6333, metalness: 0, roughness: 0.9 }),
  amarillo2:new THREE.MeshStandardMaterial({ color: 0xa1a10d, metalness: 0, roughness: 0.9 }),
  negro:   new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0, roughness: 0.9 }),
  gris:    new THREE.MeshStandardMaterial({ color: 0x3D444D, metalness: 0, roughness: 0.9 }),
  gris2:   new THREE.MeshStandardMaterial({ color: 0x292E36, metalness: 0, roughness: 0.9 }),
  default: new THREE.MeshStandardMaterial({ color: 0xffffaa, metalness: 0, roughness: 0.9 })
}
