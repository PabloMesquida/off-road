// ConeManager.js
import * as THREE from "three";
import Game from "../../../Game";

class ConeManager {
  /**
   * game: instancia de Game (ya creada, para no crear nuevas)
   * scene: THREE.Scene
   * options: { resourcePathName?: string } nombre dentro de resources.items (por defecto "coneModel")
   */
  constructor( scene, options = {}) {
    this.game = new Game();
    this.scene = scene;
    this.physics = this.game.physics;
    this.resources = this.game.resources;

    this.resourceName = options.resourcePathName || "coneModel";
    this.original = this.resources.items?.[this.resourceName]?.scene;
    if (!this.original) {
      console.error(`[ConeManager] recurso "${this.resourceName}" no encontrado en resources.items`);
      return;
    }

    // Mapa de meshes originales por nombre (para compartir geometrías)
    this._origMeshes = {};
    this.original.traverse((c) => {
      if (c.isMesh) this._origMeshes[c.name] = c;
    });

    // calcular bounding box/size UNA vez
    const box = new THREE.Box3().setFromObject(this.original);
    this._size = new THREE.Vector3();
    box.getSize(this._size);

    // crear materiales compartidos UNA vez
    this._createSharedMaterials();

    // contenedor de instancias
    this.instances = [];
  }

  _createSharedMaterials() {
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
   * Clona el modelo original pero **comparte** geometrías y materiales (no duplica géometrias).
   * Devuelve un THREE.Group preparado para añadirse a la escena.
   */
  _cloneModelShared() {
    // clonamos la estructura (transformaciones), pero volveremos a asignar geometrías compartidas
    const clone = this.original.clone(true);

    clone.traverse((child) => {
      if (!child.isMesh) return;

      // asignar geometría compartida si existe mesh original con mismo nombre
      const orig = this._origMeshes[child.name];
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
      console.warn("[ConeManager] physics no está listo aún");
      // aún así creamos visual para que aparezca; pero sin física retornamos null physicalEntity
    }

    const group = new THREE.Group();
    const model = this._cloneModelShared();
    group.add(model);

    // centrar/ajustar verticalmente igual que en tu clase original:
    // mueve el modelo hacia abajo la mitad de la altura para que el group quede en la base
    model.position.y -= this._size.y / 2;

    this.scene.add(group);

    let entity = null;
    if (this.physics && this.physics.world) {
      const physDesc = {
        type: "dynamic",
        position,
        massProperties: {
          useAdditionalMassProperties: true,
          massValue: 1.0,
          com: { x: 0, y: -this._size.y / 4, z: 0 },
        },
        colliders: [
          {
            shape: "cuboid",
            // Rapier espera los semi-ejes (half extents)
            parameters: [this._size.x * 0.5, this._size.y * 0.5, this._size.z * 0.5],
            friction: 0.6,
          },
        ],
      };

      entity = this.physics.addEntity(physDesc, group);
    }

    const inst = { group, model, physical: entity };
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
   * Opcional: limpiar todas las instancias (escena + físicas)
   */
  disposeAll() {
    this.instances.forEach((inst) => {
      // remover física
      if (inst.physical) {
        // No conozco la API de eliminación de cuerpos en tu wrapper, pero asumo que
        // tienes algún método para borrar. Si no, agrega uno en Physics (p.ej. removeEntity(key) o similar).
        // Por ahora: intentar eliminar colliders y body directamente en Rapier si está expuesto:
        try {
          const phys = inst.physical;
          if (phys && phys.physical && this.physics && this.physics.world) {
            // Si tu wrapper expone world, puedes: world.removeRigidBody(phys.physical.body) ...
            // Aquí lo dejamos como comentario para que lo adaptes a tu wrapper.
            // this.physics.world.removeRigidBody(phys.physical.body)
          }
        } catch (e) {
          // noop
        }
      }

      // remover visual
      if (inst.group) {
        this.scene.remove(inst.group);
        inst.group.traverse((c) => {
          if (c.isMesh) {
            // no dispose geometry/material porque son compartidos
            c.geometry = null;
            c.material = null;
          }
        });
      }
    });

    this.instances = [];
  }
}

export default ConeManager;
