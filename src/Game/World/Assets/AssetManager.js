import * as THREE from "three";
import Game from "../../Game";
import { GLOBAL_MATERIALS, ASSET_CONFIGS } from "./AssetConfigs.js";

class AssetManager {
  constructor(scene, options = {}) {
    this.game = new Game();
    this.scene = scene;
    this.physics = this.game.physics;
    this.resources = this.game.resources;

    this.resourceName = options.resourcePathName || "coneModel";
    this.assetType = options.assetType || "cone";

    // Buscar el modelo en los recursos cargados
    this.original = this.resources.items?.[this.resourceName]?.scene;
    if (!this.original) {
      console.warn(`[AssetManager] Recurso no encontrado: ${this.resourceName}`);
      return;
    }

    // Mapa de meshes originales para compartir geometrías
    this.origMeshes = {};
    this.original.traverse((c) => {
      if (c.isMesh) this.origMeshes[c.name] = c;
    });

    // Calcular tamaño del modelo
    const box = new THREE.Box3().setFromObject(this.original);
    this.size = new THREE.Vector3();
    box.getSize(this.size);

    // Configuración según tipo (traída de AssetConfigs.js)
    const configs = ASSET_CONFIGS(this.size);
    this.config = configs[this.assetType] || configs.cone;

    // Materiales globales compartidos
    this.sharedMaterials = GLOBAL_MATERIALS;

    // Lista de instancias creadas
    this.instances = [];

    // Preview temporal (para modo edición)
    this.preview = null;
  }

  /* ─────────────────────────────────────────────
   * Material Assignment
   * ───────────────────────────────────────────── */
  assignMaterialByAssetType(child) {
    const materialName = this.getMaterialNameForMesh(child.name);
    return this.sharedMaterials[materialName] || this.sharedMaterials.default;
  }

  getMaterialNameForMesh(meshName) {
    const mapping = this.config.materialMapping || {};

    // Exact match
    if (mapping[meshName]) return mapping[meshName];

    // Partial match (case-insensitive)
    const lowerName = meshName.toLowerCase();
    for (const [key, value] of Object.entries(mapping)) {
      if (lowerName.includes(key.toLowerCase())) return value;
    }

    // Fallback por tipo de asset
    switch (this.assetType) {
      case "cone": return "naranja";
      case "barrel": return "azul";
      default: return "default";
    }
  }

  /* ─────────────────────────────────────────────
   * Clonado eficiente (geometría + material compartido)
   * ───────────────────────────────────────────── */
  cloneModelShared() {
    const clone = this.original.clone(true);

    clone.traverse((child) => {
      if (!child.isMesh) return;

      // Compartir geometría si existe en el original
      const orig = this.origMeshes[child.name];
      if (orig) child.geometry = orig.geometry;

      // Asignar material global según mapeo
      child.material = this.assignMaterialByAssetType(child);

      child.castShadow = true;
      child.receiveShadow = true;
    });

    return clone;
  }

  /* ─────────────────────────────────────────────
   * Spawn (crear instancia física + visual)
   * ───────────────────────────────────────────── */
  spawn(position = { x: 0, y: 0, z: 0 }) {
    if (!this.physics || !this.physics.world) {
      console.warn("[AssetManager] Física no inicializada todavía.");
    }

    const group = new THREE.Group();
    const model = this.cloneModelShared();
    group.add(model);

    // Aplicar offset vertical del asset
    model.position.y += this.config.verticalOffset;
    this.scene.add(group);

    // Crear entidad física según configuración
    let entity = null;
    if (this.physics?.world) {
      const physDesc = { ...this.config.physics, position };
      entity = this.physics.addEntity(physDesc, group);
    }

    const instance = {
      group,
      model,
      body: entity?.physical?.body || null,
      colliders: entity?.physical?.colliders || null,
      physicsEntity: entity,
      assetType: this.assetType
    };

    this.instances.push(instance);
    return instance;
  }

  /* ─────────────────────────────────────────────
   * Spawn Helpers (línea o grilla)
   * ───────────────────────────────────────────── */
  spawnLine({ count = 5, start = { x: 0, y: 0.1, z: 0 }, spacing = 1.2, axis = "x", offsetY = 0 } = {}) {
    const list = [];
    for (let i = 0; i < count; i++) {
      const pos = { ...start };
      if (axis === "x") pos.x += i * spacing;
      else pos.z += i * spacing;
      pos.y += offsetY;
      list.push(this.spawn(pos));
    }
    return list;
  }

  spawnGrid({ rows = 2, cols = 5, spacingX = 1.2, spacingZ = 1.2, origin = { x: 0, y: 0.1, z: 0 } } = {}) {
    const list = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const pos = {
          x: origin.x + c * spacingX,
          y: origin.y,
          z: origin.z + r * spacingZ
        };
        list.push(this.spawn(pos));
      }
    }
    return list;
  }

  /* ─────────────────────────────────────────────
   * Preview (para modo edición)
   * ───────────────────────────────────────────── */
  createPreview() {
    if (this.preview && this.preview.group) return this.preview;

    const group = new THREE.Group();
    const model = this.cloneModelShared();

    model.traverse((c) => {
      if (!c.isMesh) return;
      const mat = c.material.clone ? c.material.clone() : new THREE.MeshStandardMaterial();
      mat.transparent = true;
      mat.opacity = 0.55;
      mat.depthWrite = false;
      c.material = mat;
      c.castShadow = c.receiveShadow = false;
      c.userData.isPreview = true;
    });

    group.add(model);
    group.userData.isPreview = true;
    group.userData.assetType = this.assetType;
    this.scene.add(group);

    this.preview = { group, model };
    return this.preview;
  }

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

  disposePreview() {
    if (!this.preview) return;
    const { group } = this.preview;

    if (this.scene.children.includes(group)) {
      this.scene.remove(group);
    }

    group.traverse((c) => {
      if (c.isMesh && c.material?.dispose) c.material.dispose();
    });

    this.preview = null;
  }

  /* ─────────────────────────────────────────────
   * Limpieza total (todas las instancias)
   * ───────────────────────────────────────────── */
  disposeAll() {
    this.disposePreview();

    for (const inst of this.instances) {
      this.scene.remove(inst.group);
      inst.group.traverse((c) => {
        if (c.isMesh && c.material?.dispose) c.material.dispose();
      });
      if (inst.physicsEntity && this.physics.removeEntity) {
        this.physics.removeEntity(inst.physicsEntity);
      }
    }

    this.instances = [];
  }

  /* ─────────────────────────────────────────────
   * Utilidades
   * ───────────────────────────────────────────── */
  resetPreview() {
    this.disposePreview();
    this.preview = null;
  }

  static getGlobalMaterials() {
    return GLOBAL_MATERIALS;
  }
}

export default AssetManager;
