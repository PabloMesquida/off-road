import * as THREE from "three";
import Game from "../../Game";

// Materiales globales compartidos por todos los assets
const GLOBAL_MATERIALS = {
  naranja: new THREE.MeshStandardMaterial({
    color: 0xad4800,
    metalness: 0,
    roughness: 0.9,
  }),
  blanco: new THREE.MeshStandardMaterial({
    color: 0xf5e8df,
    metalness: 0,
    roughness: 0.9,
  }),
  azul: new THREE.MeshStandardMaterial({
    color: 0x0066cc,
    metalness: 0,
    roughness: 0.9,
  }),
  celeste: new THREE.MeshStandardMaterial({
    color: 0x608ebd,
    metalness: 0,
    roughness: 0.9,
  }),
  rojo: new THREE.MeshStandardMaterial({
    color: 0xcc0000,
    metalness: 0,
    roughness: 0.9,
  }),
  verde: new THREE.MeshStandardMaterial({
    color: 0x00cc00,
    metalness: 0,
    roughness: 0.9,
  }),
  amarillo: new THREE.MeshStandardMaterial({
    color: 0xcccc00,
    metalness: 0,
    roughness: 0.9,
  }),
  negro: new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0,
    roughness: 0.9,
  }),
  gris: new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 0,
    roughness: 0.9,
  }),
  default: new THREE.MeshStandardMaterial({
    color: 0xffffaa,
    metalness: 0,
    roughness: 0.9,
  })
};

class AssetManager {
  constructor(scene, options = {}) {
    this.game = new Game()
    this.scene = scene
    this.physics = this.game.physics
    this.resources = this.game.resources

    this.resourceName = options.resourcePathName || "coneModel"
    this.assetType = options.assetType || "cone"
    this.original = this.resources.items?.[this.resourceName]?.scene
    
    if (!this.original) {
      return
    }

    // Mapa de meshes originales por nombre (para compartir geometrías)
    this.origMeshes = {}
    this.original.traverse((c) => {
      if (c.isMesh) this.origMeshes[c.name] = c
    })

    // calcular bounding box/size UNA vez
    const box = new THREE.Box3().setFromObject(this.original);
    this.size = new THREE.Vector3();
    box.getSize(this.size);

    // Configuraciones específicas por tipo de asset - ahora solo mapeo de materiales
    this.assetConfigs = {
      cone: {
        // Mapeo de nombres de mesh a materiales globales
        materialMapping: {
          "base": "naranja",
          "naranja": "naranja", 
          "blanco": "blanco"
        },
        physics: {
          type: "dynamic",
          massProperties: {
            useAdditionalMassProperties: true,
            massValue: 1.0,
            com: { x: 0, y: -this.size.y / 4, z: 0 }
          },
          colliders: [
            {
              shape: "cuboid",
              parameters: [this.size.x * 0.5, this.size.y * 0.5, this.size.z * 0.5],
              friction: 0.6,
            }
          ]
        },
        verticalOffset: -this.size.y / 2
      },
      barrel: {
        // Mapeo de nombres de mesh a materiales globales
        materialMapping: {
          "base": "azul",
          "azul": "azul",
          "naranja": "celeste"
        },
        physics: {
          type: "dynamic",
          massProperties: {
            useAdditionalMassProperties: true,
            massValue: 2.5,
            com: { x: 0, y: -this.size.y / 4, z: 0 }
          },
          colliders: [
            {
              shape: "cuboid", 
              parameters: [this.size.x * 0.5, this.size.y * 0.5, this.size.z * 0.5],
              friction: 0.6,
            }
          ]
        },
        verticalOffset: -this.size.y / 2 
      }
    }

    // Usar configuración del asset type o default a cone
    this.config = this.assetConfigs[this.assetType] || this.assetConfigs.cone
    
    // Usar materiales globales
    this.sharedMaterials = GLOBAL_MATERIALS;
    
    // contenedor de instancias
    this.instances = [];
  }

  /**
   * Asigna materiales según el tipo de asset y nombre del mesh
   */
  assignMaterialByAssetType(child) {
    console.log('aca',this.getMaterialNameForMesh(child.name))
    const materialName = this.getMaterialNameForMesh(child.name);
    return this.sharedMaterials[materialName] || this.sharedMaterials.default;
  }

  /**
   * Obtiene el nombre del material global para un mesh específico
   */
  getMaterialNameForMesh(meshName) {
    const mapping = this.config.materialMapping || {};
    console.log('OK', meshName)
    // Buscar coincidencia exacta primero
    if (mapping[meshName]) {
      return mapping[meshName];
    }


    
    // Buscar por coincidencia parcial (case insensitive)
    const lowerName = meshName.toLowerCase();
    for (const [key, value] of Object.entries(mapping)) {
      if (lowerName.includes(key.toLowerCase())) {
        console.log('x', value)
        return value;
      }
    }
    
    // Material por defecto basado en el tipo de asset
    switch (this.assetType) {
      case "cone":
        return "naranja";
      case "barrel":
        return "azul";
      default:
        return "default";
    }
  }

  /**
   * Clona el modelo original pero comparte geometrías y materiales.
   * Devuelve un THREE.Group preparado para añadirse a la escena.
   */
  cloneModelShared() {
    const clone = this.original.clone(true)

    clone.traverse((child) => {
      if (!child.isMesh) return

      // asignar geometría compartida si existe mesh original con mismo nombre
      const orig = this.origMeshes[child.name]
      if (orig) {
        child.geometry = orig.geometry;
      }

      // asignar material global según tipo de asset
      const material = this.assignMaterialByAssetType(child);
      child.material = material;

      child.castShadow = true;
      child.receiveShadow = true;
    });
     
    return clone;
  }

  /**
   * Crea una instancia (visual + física) en una posición dada.
   * position: {x,y,z}
   * returns: objeto { group, body, colliders, physicsEntity }
   */
  spawn(position = { x: 0, y: 0, z: 0 }) {
    if (!this.physics || !this.physics.world) {
      console.warn("[AssetManager] physics no está listo aún")
    }

    const group = new THREE.Group()
    const model = this.cloneModelShared()
    group.add(model)

    // Aplicar offset vertical según configuración del asset
    model.position.y += this.config.verticalOffset

    this.scene.add(group)

    let entity = null;
    if (this.physics && this.physics.world) {
      // Usar directamente la configuración de física del asset
      const physDesc = {
        ...this.config.physics,
        position // Añadir la posición específica
      };
      
      entity = this.physics.addEntity(physDesc, group);
    }

    const inst = {
      group,
      model,
      body: entity?.physical?.body || null,
      colliders: entity?.physical?.colliders || null,
      physicsEntity: entity,
      assetType: this.assetType
    };
    
    this.instances.push(inst);
    return inst;
  }

  /**
   * Spawn multiple in a line (ordenados).
   */
  spawnLine({ count = 5, start = { x: 0, y: 0.1, z: 0 }, spacing = 1.2, axis = "x", offsetY = 0 } = {}) {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const pos = { x: start.x, y: start.y + offsetY, z: start.z };
      if (axis === "x") pos.x = start.x + i * spacing;
      else pos.z = start.z + i * spacing;

      arr.push(this.spawn(pos));
    }
    return arr;
  }

  /**
   * Spawn en una rejilla ordenada (grid)
   */
  spawnGrid({ rows = 2, cols = 5, spacingX = 1.2, spacingZ = 1.2, origin = { x: 0, y: 0.1, z: 0 } } = {}) {
    const list = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = origin.x + c * spacingX;
        const z = origin.z + r * spacingZ;
        list.push(this.spawn({ x, y: origin.y, z }));
      }
    }
    return list;
  }

  /**
   * Crea (y devuelve) un preview del modelo
   */
  createPreview() {
    if (this.preview && this.preview.group) {
      return this.preview;
    }

    const group = new THREE.Group();
    const model = this.cloneModelShared();

    // Para preview queremos materiales semitransparentes
    model.traverse((c) => {
      if (!c.isMesh) return;

      const previewMat = c.material.clone ? c.material.clone() : new THREE.MeshStandardMaterial();
      previewMat.transparent = true;
      previewMat.opacity = 0.55;
      previewMat.roughness = (previewMat.roughness ?? 0.9);
      previewMat.depthWrite = false;
      c.material = previewMat;

      c.castShadow = false;
      c.receiveShadow = false;
      c.userData.isPreview = true;
    });

    // Para el preview NO aplicamos el verticalOffset
    model.position.y = 0;

    group.add(model);
    group.userData.isPreview = true;
    group.userData.assetType = this.assetType;

    this.scene.add(group);

    this.preview = { group, model };
    return this.preview;
  }

  /**
   * Muestra (o actualiza) la posición del preview en worldPos {x,y,z}.
   */
  updatePreviewPosition(worldPos) {
    if (!this.preview) return;
    const { group } = this.preview;
    if (!worldPos) {
      group.visible = false;
      return;
    }
    group.visible = true;
  
    // Para el preview, usamos la posición exacta del rayo
    // ya que el modelo está centrado correctamente
    group.position.set(worldPos.x, worldPos.y, worldPos.z);
  }

  /**
   * Elimina el preview de la escena y limpia referencias.
   */
disposePreview() { 
  if (!this.preview) {
    return;
  }
  
  const { group } = this.preview;
  
  // Verificar si el grupo está en la escena antes de removerlo
  const index = this.scene.children.indexOf(group);
  
  if (index !== -1) {
    this.scene.remove(group);
  } else {
    console.warn(`[AssetManager ${this.assetType}] Grupo NO encontrado en escena!`);
  }
  
  group.traverse((c) => {
    if (c.isMesh && c.material && c.material.dispose) {
      c.material.dispose();
    }
  });
  
  this.preview = null;
}

  /**
   * Limpia todas las instancias de este asset manager
   */
  disposeAll() {
    this.disposePreview();
    
    this.instances.forEach(instance => {
      this.scene.remove(instance.group);
      instance.group.traverse((c) => {
        if (c.isMesh && c.material && c.material.dispose) {
          c.material.dispose();
        }
      });
      
      if (instance.physicsEntity && this.physics.removeEntity) {
        this.physics.removeEntity(instance.physicsEntity);
      }
    });
    
    this.instances = [];
  }

  /**
   * Método estático para acceder a los materiales globales desde fuera
   */
  static getGlobalMaterials() {
    return GLOBAL_MATERIALS;
  }

  /**
   * Limpia el preview y asegura que no queden referencias
   */
  resetPreview() {
    this.disposePreview()
    this.preview = null
  }
}

export default AssetManager;