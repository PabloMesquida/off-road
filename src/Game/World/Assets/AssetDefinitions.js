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
      azul_1: 'azul',
      azul_2: 'azul',
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
