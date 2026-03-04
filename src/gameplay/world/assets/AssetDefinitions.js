export const ASSET_CONFIGS = (size) => ({
  cone: {
    materialMapping: {
      body: 'naranja',
      stripe: 'blanco'
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
      body: 'azul',
      stripe: 'celeste',
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
      body: 'gris',
      border: 'amarillo',
      stripe: 'amarillo'
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
      body: 'gris',
      stripe: 'amarillo'
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
      body: 'gris',
      stripe: 'amarillo'
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
      bar_1: 'gris',
      support: 'gris',
      base: 'negro',
      base_accent: 'gris',
      sign: 'negro',
      back: 'gris',
      front: 'amarillo2',
      border: 'negro'
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
      bar_1: 'gris',
      support: 'gris',
      base: 'negro',
      base_accent: 'gris',
      back: 'gris',
      sign: 'blanco',
      front: 'rojo',
      border: 'blanco'
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
      bar_1: 'gris',
      support: 'gris',
      base: 'negro',
      base_accent: 'gris',
      border: 'rojo',
      back: 'gris',
      front: 'blanco',
      sign: 'negro'
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
      bar_1: 'gris',
      support: 'gris',
      base: 'negro',
      base_accent: 'gris',
      sign: 'blanco',
      back: 'gris',
      border: 'blanco',
      front: 'rojo'
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
      rubber: 'negro'
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
