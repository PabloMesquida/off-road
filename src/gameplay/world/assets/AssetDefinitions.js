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
        {
          shape: 'cone',
          parameters: [size.y * 0.5, size.x * 0.4],
          friction: 1.2
        }
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
        {
          shape: "cylinder",
          parameters: [0.5, 0.4],             
          friction: 0.8, 
          restitution: 0.1,                
          density: 1.0
        }
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
      colliders: [
        {   
          shape: "hull",         
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
      colliders: [
        { 
          shape: "hull", 
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
     colliders: [ { shape: "hull", friction: 1.2 } ]
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
          { shape: 'cylinder', parameters: [0.8, 0.02], rotation: { x: 0, y: 0, z: 0}, rofriction: 1.2 },
          { shape: 'cylinder',  parameters: [0.02, 0.34], offset: { x: 0, y:-size.y / 2 + 0.01, z: 0 }, friction: 1.2 },
          { shape: 'cylinder',  parameters: [0.02, 0.32], offset: { x: 0.05, y:size.y / 2 - 0.32, z: 0 }, rotation: { x: 0, y: 0, z: Math.PI/2}, friction: 1.2 }
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
        { shape: 'cylinder', parameters: [0.8, 0.02], rotation: { x: 0, y: 0, z: 0}, rofriction: 1.2 },
        { shape: 'cylinder',  parameters: [0.02, 0.34], offset: { x: 0, y:-size.y / 2 + 0.01, z: 0 }, friction: 1.2 },
        { shape: 'cylinder',  parameters: [0.02, 0.32], offset: { x: 0.05, y:size.y / 2 - 0.32, z: 0 }, rotation: { x: 0, y: 0, z: Math.PI/2}, friction: 1.2 }
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
        { shape: 'cylinder', parameters: [0.8, 0.02], rotation: { x: 0, y: 0, z: 0}, rofriction: 1.2 },
        { shape: 'cylinder',  parameters: [0.02, 0.34], offset: { x: 0, y:-size.y / 2 + 0.01, z: 0 }, friction: 1.2 },
        { shape: 'cylinder',  parameters: [0.02, 0.32], offset: { x: 0.05, y:size.y / 2 - 0.32, z: 0 }, rotation: { x: 0, y: 0, z: Math.PI/2}, friction: 1.2 }
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
        { shape: 'cylinder', parameters: [0.8, 0.02], rotation: { x: 0, y: 0, z: 0}, rofriction: 1.2 },
        { shape: 'cylinder',  parameters: [0.02, 0.34], offset: { x: 0, y:-size.y / 2 + 0.01, z: 0 }, friction: 1.2 },
        { shape: 'cylinder',  parameters: [0.02, 0.32], offset: { x: 0.05, y:size.y / 2 - 0.32, z: 0 }, rotation: { x: 0, y: 0, z: Math.PI/2}, friction: 1.2 }
      ]
    },
    verticalOffset: -size.y / 2
  },
  
  tire: {
    materialMapping: { 
      rubber: 'negro'
    },
    physicsOptions: {
      linearDamping: 1.2,
      angularDamping: 5.0,
      solverIterations: 8
    },
    physics: {
      type: 'dynamic',
      massProperties: {
        useAdditionalMassProperties: true,
        massValue: 2,
        com: { x: 0, y: 0, z: 0 }
      },                     
      colliders: [
        {
          shape: "cylinder",
          parameters: [0.1, 0.35],             
          friction: 0.2, 
          restitution: 0.6,                
          density: 1.0
        }
      ]
    },
    verticalOffset: -size.y / 2
  },

})
