import * as THREE from 'three'

const createMat = (color) => {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0,
    roughness: 0.9,
    aoMapIntensity: 1.0 
  })
}

export const GLOBAL_MATERIALS = {
  naranja: createMat(0xad4800),
  blanco:  createMat(0xf5e8df),
  azul:    createMat(0x0066cc),
  celeste: createMat(0x608ebd),
  rojo:    createMat(0xcc0000),
  verde:   createMat(0x00cc00),
  amarillo:createMat(0x5A6333),
  amarillo2:createMat(0xa1a10d),
  negro:   createMat(0x333333),
  gris:    createMat(0x3D444D),
  gris2:   createMat(0x292E36),
  default: createMat(0xffffaa)
}