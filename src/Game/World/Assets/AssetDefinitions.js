
import * as THREE from 'three'

//  Materiales globales reutilizables
export const GLOBAL_MATERIALS = {
  naranja: new THREE.MeshStandardMaterial({ color: 0xad4800, metalness: 0, roughness: 0.9 }), // OK
  blanco:  new THREE.MeshStandardMaterial({ color: 0xf5e8df, metalness: 0, roughness: 0.9 }), // OK
  azul:    new THREE.MeshStandardMaterial({ color: 0x0066cc, metalness: 0, roughness: 0.9 }), // OK
  celeste: new THREE.MeshStandardMaterial({ color: 0x608ebd, metalness: 0, roughness: 0.9 }), // OK
  rojo:    new THREE.MeshStandardMaterial({ color: 0xcc0000, metalness: 0, roughness: 0.9 }),
  verde:   new THREE.MeshStandardMaterial({ color: 0x00cc00, metalness: 0, roughness: 0.9 }),
  amarillo:new THREE.MeshStandardMaterial({ color: 0x5A6333, metalness: 0, roughness: 0.9 }),
  amarillo2:new THREE.MeshStandardMaterial({ color: 0xa1a10d, metalness: 0, roughness: 0.9 }),
  negro:   new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0, roughness: 0.9 }),
  gris:    new THREE.MeshStandardMaterial({ color: 0x3D444D, metalness: 0, roughness: 0.9 }),
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
        { shape: 'cuboid', parameters: [size.x * 0.5, size.y * 0.5, size.z * 0.5], friction: 1.2 }
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
        { shape: 'cuboid', parameters: [size.x * 0.5, size.y * 0.5, size.z * 0.5], friction: 1.2 }
      ]
    },
    verticalOffset: -size.y / 2
  },

  ramp: {
    materialMapping: { 
      rampa: 'gris',
      rampaBorder: 'amarillo',
      rampaLine: 'amarillo'
    },
    physics: {
      type: 'fixed',       
      usesConvex: true,                  

      colliders: [
        {
          shape: "convex",
          parameters: {},                 
          friction: 1.3,                 
          density: 1.0
        }
      ]
    },

    verticalOffset: 0
  },
  bump: {
    materialMapping: { 
      bump01: 'gris',
      bump02: 'amarillo'
    },
    physics: {
      type: 'fixed',       
      usesConvex: true,                  
      colliders: [
        {
          shape: "convex",
          parameters: {},                 
          friction: 1.3,                 
          density: 1.0
        }
      ]
    },
    verticalOffset: 0
  },
  barrier: {
    materialMapping: { 
      barrier1: 'gris',
      barrier2: 'amarillo'
    },
    physics: {
      type: 'dynamic',
      massProperties: {
        useAdditionalMassProperties: true,
        massValue: 32,
        com: { x: 0, y: -size.y / 2, z: 0 }
      },
      colliders: [
        { shape: 'cuboid', parameters: [size.x * 0.5, size.y * 0.5, size.z * 0.5], friction: 1.2 }
      ]
    },
    verticalOffset:  -size.y / 2
  },
  signAhead: {
    materialMapping: { 
      barra: 'gris',
      barra2: 'gris',
       base1: 'negro',
      base2: 'gris',
      signAhead1: 'negro',
      signAhead2: 'gris',
      signAhead3: 'amarillo2',
      signAhead4: 'negro'
    },
    physics: {
      type: 'dynamic',
      massProperties: {
        useAdditionalMassProperties: true,
        massValue: 10,
        com: { x: 0, y: 0, z: 0 }
      },
      colliders: [
        { shape: 'cuboid', parameters: [size.x * 0.5, size.y * 0.5, size.z * 0.5], friction: 1.2 }
      ]
    },
    verticalOffset: -size.y / 2
  },
  signStop: {
    materialMapping: { 
      barra: 'gris',
      barra2: 'gris',
      base1: 'negro',
      base2: 'gris',
      signStop1: 'gris',
      signStop2: 'blanco',
      signStop3: 'rojo',
      signStop4: 'blanco'
    },
    physics: {
      type: 'dynamic',
      massProperties: {
        useAdditionalMassProperties: true,
        massValue: 10,
        com: { x: 0, y: 0, z: 0 }
      },
      colliders: [
        { shape: 'cuboid', parameters: [size.x * 0.5, size.y * 0.5, size.z * 0.5], friction: 1.2 }
      ]
    },
    verticalOffset: -size.y / 2
  },
  signWarning: {
    materialMapping: { 
      barra: 'gris',
      barra2: 'gris',
      base1: 'negro',
      base2: 'gris',
      signWarning1: 'rojo',
      signWarning2: 'gris',
      signWarning3: 'blanco',
      signWarning4: 'negro'
    },
    physics: {
      type: 'dynamic',
      massProperties: {
        useAdditionalMassProperties: true,
        massValue: 10,
        com: { x: 0, y: 0, z: 0 }
      },
      colliders: [
        { shape: 'cuboid', parameters: [size.x * 0.5, size.y * 0.5, size.z * 0.5], friction: 1.2 }
      ]
    },
    verticalOffset: -size.y / 2
  },
  signNot: {
    materialMapping: { 
      barra: 'gris',
      barra2: 'gris',
      base1: 'negro',
      base2: 'gris',
      signNot1: 'blanco',
      signNot2: 'gris',
      signNot3: 'blanco',
      signNot4: 'rojo'
    },
    physics: {
      type: 'dynamic',
      massProperties: {
        useAdditionalMassProperties: true,
        massValue: 10,
        com: { x: 0, y: 0, z: 0 }
      },
      colliders: [
        { shape: 'cuboid', parameters: [size.x * 0.5, size.y * 0.5, size.z * 0.5], friction: 1.2 }
      ]
    },
    verticalOffset: -size.y / 2
  },
    tire: {
    materialMapping: { 
      rueda: 'negro'
    },
    physics: {
      type: 'dynamic',       
      usesConvex: true,                  
      colliders: [
        {
          shape: "convex",
          parameters: {},                 
          friction: 1.3,                 
          density: 1.0
        }
      ]
    },
    verticalOffset: 0
  },

})
