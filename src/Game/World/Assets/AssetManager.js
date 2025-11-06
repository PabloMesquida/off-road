import * as THREE from "three";
import Game from "../../Game";

class AssetManager {
  constructor( scene, options = {}) {
    this.game = new Game()
    this.scene = scene
    this.physics = this.game.physics
    this.resources = this.game.resources

    this.resourceName = options.resourcePathName || "coneModel"
    this.original = this.resources.items?.[this.resourceName]?.scene
    if (!this.original) {
      console.error(`[AssetManager] recurso "${this.resourceName}" no encontrado en resources.items`)
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

    // crear materiales compartidos UNA vez
    this.createSharedMaterials();
    
    // contenedor de instancias
    this.instances = [];
  }

  createSharedMaterials() {
    // usa los mismos nombres que usabas en tu Cone original
    this.sharedMaterials = {
      base: new THREE.MeshStandardMaterial({
        color: 0xad4800,
        metalness: 0,
        roughness: 0.9,
      }),
      cone: new THREE.MeshStandardMaterial({
        color: 0xad4800,
        metalness: 0,
        roughness: 0.9,
      }),
      stripe: new THREE.MeshStandardMaterial({
        color: 0xf5e8df,
        metalness: 0,
        roughness: 0.9,
      }),
      default: new THREE.MeshStandardMaterial({
        color: 0xaaaaaa,
      }),
    };
  }

  /**
   * Clona el modelo original pero comparte geometrías y materiales.
   * Devuelve un THREE.Group preparado para añadirse a la escena.
   */
  cloneModelShared() {
    // clonamos la estructura (transformaciones), pero volveremos a asignar geometrías compartidas
    const clone = this.original.clone(true)

    clone.traverse((child) => {
      if (!child.isMesh) return

      // asignar geometría compartida si existe mesh original con mismo nombre
      const orig = this.origMeshes[child.name]
      if (orig) {
        child.geometry = orig.geometry; // comparte BufferGeometry
      }

      // asignar material compartido según nombre
      let mat;
      switch (child.name) {
        case "Base":
          mat = this.sharedMaterials.base;
          break;
        case "Cono":
          mat = this.sharedMaterials.cone;
          break;
        case "ConoFranja":
          mat = this.sharedMaterials.stripe;
          break;
        default:
          mat = this.sharedMaterials.default;
      }
      child.material = mat;

      child.castShadow = true;
      child.receiveShadow = true;
    });
     
    return clone;
  }

  /**
   * Crea una instancia (visual + física) en una posición dada.
   * position: {x,y,z}
   * returns: objeto { group, physicalEntity }
   */
  spawn(position = { x: 0, y: 0, z: 0 }) {
    if (!this.physics || !this.physics.world) {
      console.warn("[ConeManager] physics no está listo aún")
      // aún así creamos visual para que aparezca; pero sin física retornamos null physicalEntity
    }

    const group = new THREE.Group()
    const model = this.cloneModelShared()
    group.add(model)

    // centrar/ajustar verticalmente igual que en tu clase original:
    // mueve el modelo hacia abajo la mitad de la altura para que el group quede en la base
    model.position.y -= this.size.y / 2

    this.scene.add(group)

    let entity = null;
    if (this.physics && this.physics.world) {
      const physDesc = {
        type: "dynamic",
        position,
        massProperties: {
          useAdditionalMassProperties: true,
          massValue: 1.0,
          com: { x: 0, y: -this.size.y / 4, z: 0 },
        },
        colliders: [
          {
            shape: "cuboid",
            // Rapier espera los semi-ejes (half extents)
            parameters: [this.size.x * 0.5, this.size.y * 0.5, this.size.z * 0.5],
            friction: 0.6,
          },
        ],
      };

      entity = this.physics.addEntity(physDesc, group);
    }

    const inst = {
      group,
      model,
      body: entity?.physical?.body || null,
      colliders: entity?.physical?.colliders || null,
      physicsEntity: entity, // opcional, si querés conservar referencia completa
    };
    this.instances.push(inst);
    return inst;
  }

  /**
   * Spawn multiple in a line (ordenados).
   * options:
   *   count: número de conos
   *   start: {x,y,z} posición del primer cono
   *   spacing: distancia entre conos (float)
   *   axis: 'x'|'z' (eje a lo largo del cual ordenar). Por defecto 'x'
   *   offsetY: valor para y (altitud) por si quieres ajustar
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
   * rows, cols, spacingX, spacingZ, origin
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
   * Crea (y devuelve) un preview del modelo: grupo visual transparente
   * no interactúa con física y no lanza sombras.
   * El preview comparte geometrías y materiales base, pero crea materiales
   * clonados para poder hacerlos transparentes sin afectar al resto.
   */
  createPreview() {
    // Si ya existe un preview, devolverlo
    if (this.preview && this.preview.group) return this.preview;

    const group = new THREE.Group();
    const model = this.cloneModelShared();
     // model.position.y += this.size.y / 2

    // Para preview queremos materiales semitransparentes pero sin tocar los
    // sharedMaterials (que usan las instancias reales). Creamos clones ligeros.
    model.traverse((c) => {
      if (!c.isMesh) return;

      // clonar material superficialmente para modificar transparencia
      let m = c.material;
      // si el material es uno de los compartidos, hacemos una copia simple
      const previewMat = m.clone ? m.clone() : new THREE.MeshStandardMaterial();
      previewMat.transparent = true;
      previewMat.opacity = 0.55;
      // reducir brillo para que no parezca físico
      previewMat.roughness = (previewMat.roughness ?? 0.9);
      previewMat.depthWrite = false; // evitar z-fighting con el suelo
      c.material = previewMat;

      // desactivar sombras
      c.castShadow = false;
      c.receiveShadow = false;
      // marcar para identificarlo luego
      c.userData.isPreview = true;
    });

    // ajustar vertical como en spawn: mover modelo hacia abajo la mitad
    model.position.y -= this.size.y / 2;

    group.add(model);


    // Opcional: escalar preview si quieres que sea más pequeño
    // group.scale.setScalar(1.0);

    group.userData.isPreview = true;

    this.scene.add(group);

    this.preview = { group, model };
    return this.preview;
  }

  /**
   * Muestra (o actualiza) la posición del preview en worldPos {x,y,z}.
   * Si worldPos es null oculta el preview (visible = false).
   */
  updatePreviewPosition(worldPos) {
    if (!this.preview) return;
    const { group } = this.preview;
    if (!worldPos) {
      group.visible = false;
      return;
    }
    group.visible = true;
    group.position.set(worldPos.x, worldPos.y, worldPos.z);
  }

  /**
   * Elimina el preview de la escena y limpia referencias.
   */
  disposePreview() {
    if (!this.preview) return;
    const { group } = this.preview;
    this.scene.remove(group);
    group.traverse((c) => {
      if (c.isMesh) {
        // los geometrías son compartidas, no las dispose.
        if (c.material && c.material.dispose) {
          c.material.dispose();
        }
      }
    });
    this.preview = null;
  }

}

export default AssetManager;
